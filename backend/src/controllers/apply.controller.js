import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { extractJobInfo } from '../utils/jdExtractor.js';
import { generateFastEmail } from '../services/fastEmail.service.js';
import { sendEmail, sendEmailViaGmail } from '../services/email.service.js';
import { Resume } from '../models/Resume.js';
import { User } from '../models/User.js';
import { Application } from '../models/Application.js';
import { getAccessTokenForUser } from '../controllers/gmail.controller.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { performance } from 'perf_hooks';
import { getResumeBuffer, resumeExists } from '../services/resumeStorage.service.js';
import {
  matchResumeToJD,
  resolveFinalSubject,
  validateApplicationInstructions,
  validateGeneratedEmail,
  getCandidateProfiles,
  findGraduationYear,
  finalizeEmailBody,
} from '../utils/emailInstruction.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRecipient(email) {
  return email && typeof email === 'string' && EMAIL_REGEX.test(email);
}

function buildAttachmentName(name) {
  if (!name) return 'Resume';
  return name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') + '_CV';
}

async function retrieveResumeBuffer(resumeData, uploadedFile) {
  // Priority 1: GridFS fileId
  if (resumeData?.fileId) {
    try {
      const exists = await resumeExists(resumeData.fileId);
      if (exists) {
        console.log('[FAST APPLY] Reading resume from GridFS');
        const buffer = await getResumeBuffer(resumeData.fileId);
        return { buffer, source: 'gridfs' };
      }
      console.log('[FAST APPLY] GridFS file no longer exists');
    } catch (e) {
      console.error(`[FAST APPLY] GridFS read failed: ${e.message}`);
    }
  }

  // Priority 2: Legacy filePath on disk
  if (resumeData?.filePath) {
    try {
      if (fs.existsSync(resumeData.filePath)) {
        console.log('[FAST APPLY] Reading resume from legacy filePath');
        const buffer = fs.readFileSync(resumeData.filePath);
        return { buffer, source: 'legacy' };
      }
    } catch (e) {
      console.error(`[FAST APPLY] Legacy file read failed: ${e.message}`);
    }
  }

  // Priority 3: Newly uploaded file in this request
  if (uploadedFile?.buffer) {
    console.log('[FAST APPLY] Using uploaded file buffer');
    return { buffer: uploadedFile.buffer, source: 'upload' };
  }

  return null;
}

export async function apply(req, res) {
  const uploadMiddleware = upload.fields([{ name: 'resume', maxCount: 1 }]);

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return errorResponse(res, err.message || 'File upload failed', 400);
    }

    const totalStart = Date.now();

    try {
      const userId = req.userId;
      const { jobText, autoSend } = req.body;
      const resumeFile = req.files?.resume?.[0];

      if (!jobText || typeof jobText !== 'string' || jobText.trim() === '') {
        return errorResponse(res, 'Job text is required', 400);
      }
      if (jobText.trim().length > 20000) {
        return errorResponse(res, 'Job text exceeds maximum length', 400);
      }

      console.log(`[FAST APPLY] Starting for user ${userId}...`);

      console.time('[FAST APPLY] JD extraction');
      const jobInfo = extractJobInfo(jobText.trim());
      console.timeEnd('[FAST APPLY] JD extraction');
      console.log(`[FAST APPLY] Extracted: company=${jobInfo.company}, role=${jobInfo.role}, email=${jobInfo.recipientEmail}`);
      console.log(`[FAST APPLY] Instructions: subject=${jobInfo.subjectRequirement || 'none'}, jobId=${jobInfo.jobId || 'none'}, attachments=${jobInfo.requiredAttachments?.length || 0}, appInstructions=${jobInfo.applicationInstructions?.length || 0}`);

      console.time('[FAST APPLY] resume fetch');
      let resumeData = await Resume.findOne({ userId }).lean();

      if (!resumeData && resumeFile) {
        if (resumeFile.mimetype !== 'application/pdf') {
          return errorResponse(res, 'Only PDF resumes are supported', 400);
        }
        const cachedResume = await Resume.findOne({ userId, originalFilename: resumeFile.originalname }).lean();
        if (cachedResume) {
          resumeData = cachedResume;
        } else {
          return errorResponse(res, 'Resume not found. Please upload via /api/resume first.', 400);
        }
      }

      if (!resumeData) {
        return errorResponse(res, 'No resume found. Please upload your resume first.', 400);
      }
      console.timeEnd('[FAST APPLY] resume fetch');

      const user = await User.findById(userId).lean();
      const profileLinks = { github: user?.github || null, linkedin: user?.linkedin || null };

      // Relevant resume context matched against the JD
      const match = matchResumeToJD(jobInfo, resumeData);

      console.time('[FAST APPLY] email generation');
      const emailResult = await generateFastEmail(jobInfo, resumeData, match, profileLinks);
      console.timeEnd('[FAST APPLY] email generation');

      if (!emailResult) {
        const totalDuration = Date.now() - totalStart;
        console.log(`[FAST APPLY] TOTAL: ${totalDuration}ms (email generation failed)`);
        return successResponse(res, 'Email generation temporarily failed due to AI provider issues', {
          company: jobInfo.company,
          role: jobInfo.role,
          recipient: jobInfo.recipientEmail,
          emailSent: false,
          sendStatus: 'AI_UNAVAILABLE',
          durationMs: totalDuration
        });
      }

      // Deterministic subject resolution: JD instruction is authoritative.
      const finalSubject = resolveFinalSubject({
        jdSubjectRequirement: jobInfo.subjectRequirement,
        jobId: jobInfo.jobId,
        aiSubject: emailResult.subject,
        role: jobInfo.role,
        candidateName: resumeData.personal?.name || resumeData.name,
      });

      // Candidate's real profile links (for signature dedup + grad-year reconciliation) come from
      // trusted resume/User data. The profile URLs belong ONLY in the deterministic email footer
      // appended by email.service.js, never in the AI-generated body.
      const candidateProfiles = getCandidateProfiles(resumeData, profileLinks);
      const realGradYear = findGraduationYear(resumeData);

      // Deterministic final-output cleanup: strip any markdown fences / artifacts, remove ANY
      // LinkedIn/GitHub/portfolio URL (incl. whole markdown link blocks) that leaked into the AI
      // body, enforce the EXACT company & role verbatim, and keep the candidate's real graduation
      // year. The signature/footer is appended exactly once by email.service.js, so after this the
      // body passed to it never carries a second profile-link block.
      const finalBody = finalizeEmailBody({
        body: emailResult.body,
        profiles: candidateProfiles,
        company: jobInfo.company,
        role: jobInfo.role,
        gradYear: realGradYear,
      });

      const instructionCheck = validateApplicationInstructions({
        finalSubject,
        jobId: jobInfo.jobId,
        requiredAttachments: jobInfo.requiredAttachments,
        recipient: emailResult.recipient,
      });

      const bodyCheck = validateGeneratedEmail({
        subject: finalSubject,
        body: finalBody,
        company: jobInfo.company,
        role: jobInfo.role,
        candidateName: resumeData.personal?.name || resumeData.name,
      });

      const instructionValidation = {
        subject: finalSubject,
        problems: [...bodyCheck.problems, ...instructionCheck.problems],
      };
      const instructionValidationPassed = bodyCheck.pass && instructionCheck.pass;

      const finalRecipient = emailResult.recipient || jobInfo.recipientEmail;
      const hasValidRecipient = validateRecipient(finalRecipient);
      const shouldAutoSend = autoSend === 'true' || autoSend === true;

      if (!hasValidRecipient) {
        const totalDuration = Date.now() - totalStart;
        console.log(`[FAST APPLY] TOTAL: ${totalDuration}ms (no recipient)`);
        return successResponse(res, 'Email generated but no recipient email found', {
          company: jobInfo.company,
          role: jobInfo.role,
          recipient: null,
          email: { subject: finalSubject, body: finalBody },
          instructionValidation,
          emailSent: false,
          sendStatus: 'RECIPIENT_UNAVAILABLE',
          durationMs: totalDuration
        });
      }

      if (!shouldAutoSend) {
        const totalDuration = Date.now() - totalStart;
        console.log(`[FAST APPLY] TOTAL: ${totalDuration}ms (generate only)`);
        return successResponse(res, 'Email generated successfully', {
          company: jobInfo.company,
          role: jobInfo.role,
          recipient: finalRecipient,
          email: { subject: finalSubject, body: finalBody },
          instructionValidation,
          emailSent: false,
          sendStatus: 'READY_TO_SEND',
          durationMs: totalDuration
        });
      }

      // Retrieve resume PDF buffer from GridFS / legacy / upload
      console.time('[FAST APPLY] storage read');
      const resumeResult = await retrieveResumeBuffer(resumeData, resumeFile);
      console.timeEnd('[FAST APPLY] storage read');

      if (!resumeResult || !resumeResult.buffer) {
        return errorResponse(res, 'Resume PDF is not available in storage. Please upload your resume again.', 400);
      }

      const resumeBuffer = resumeResult.buffer;
      const attachmentName = buildAttachmentName(resumeData.personal?.name);

      let sendResult;
      let sendMethod = 'smtp';
      const gmailConnection = await getAccessTokenForUser(userId);

      const sendStart = performance.now();
      try {
        if (gmailConnection) {
          sendResult = await sendEmailViaGmail({
            recipient: finalRecipient,
            subject: finalSubject,
            body: finalBody,
            resumeBuffer,
            attachmentName,
            oauth2Client: gmailConnection.oauth2Client,
            profileLinks,
          });
          sendMethod = 'gmail';
        } else {
          sendResult = await sendEmail({
            recipient: finalRecipient,
            subject: finalSubject,
            body: finalBody,
            resumeBuffer,
            attachmentName,
            profileLinks,
          });
        }
        const sendEnd = performance.now();
        const totalDuration = Date.now() - totalStart;

        const timing = sendResult.timing || {};
        console.log(`[FAST APPLY] TIMING | JD: ~0ms | Resume: ~1ms | StorageRead: ${timing.storageRead || timing.fileRead || 'N/A'} | SMTP: ${timing.smtp || 'N/A'} | TOTAL: ${totalDuration}ms | Via: ${sendMethod}`);

        await Application.create({
          userId,
          resumeId: resumeData._id,
          company: jobInfo.company,
          role: jobInfo.role,
          recipient: finalRecipient,
          jobText: jobText.trim(),
          email: { subject: finalSubject, body: finalBody },
          status: 'sent',
          timing: {
            fileRead: timing.storageRead || timing.fileRead,
            smtp: timing.smtp,
            total: timing.total,
          },
          durationMs: totalDuration,
          applicationInstructions: jobInfo.applicationInstructions,
          subjectRequirement: jobInfo.subjectRequirement,
          jobId: jobInfo.jobId,
          referenceNumber: jobInfo.referenceNumber,
          instructionValidation: {
            subject: finalSubject,
            problems: instructionValidation.problems,
          },
          instructionValidationPassed,
        });

        return successResponse(res, 'Application email sent successfully', {
          company: jobInfo.company,
          role: jobInfo.role,
          recipient: finalRecipient,
          email: { subject: finalSubject, body: finalBody },
          instructionValidation,
          emailSent: true,
          sendMethod,
          durationMs: totalDuration,
          timing: {
            total: totalDuration,
            fileRead: timing.storageRead || timing.fileRead,
            smtp: timing.smtp,
            attachmentSize: timing.attachmentSize
          }
        });
      } catch (sendError) {
        const sendEnd = performance.now();
        const totalDuration = Date.now() - totalStart;
        console.error(`[FAST APPLY] Email send error: ${sendError.message} | Duration: ${sendEnd - sendStart}ms`);

        await Application.create({
          userId,
          resumeId: resumeData._id,
          company: jobInfo.company,
          role: jobInfo.role,
          recipient: finalRecipient,
          jobText: jobText.trim(),
          email: { subject: finalSubject, body: finalBody },
          status: 'failed',
          error: sendError.message,
          durationMs: totalDuration,
          applicationInstructions: jobInfo.applicationInstructions,
          subjectRequirement: jobInfo.subjectRequirement,
          jobId: jobInfo.jobId,
          referenceNumber: jobInfo.referenceNumber,
          instructionValidation: {
            subject: finalSubject,
            problems: instructionValidation.problems,
          },
          instructionValidationPassed,
        });

        return successResponse(res, 'Email generated but sending failed', {
          company: jobInfo.company,
          role: jobInfo.role,
          recipient: finalRecipient,
          email: { subject: finalSubject, body: finalBody },
          instructionValidation,
          emailSent: false,
          sendStatus: 'FAILED',
          sendError: sendError.message,
          durationMs: totalDuration
        });
      }
    } catch (error) {
      const totalDuration = Date.now() - totalStart;
      console.error('[FAST APPLY] Error:', error.message);
      return errorResponse(res, error.message || 'Failed to process application');
    }
  });
}
