import { PDFParse } from 'pdf-parse';
import { parseResumeWithAI } from '../services/ai.service.js';
import { Resume } from '../models/Resume.js';
import { successResponse, errorResponse } from '../utils/response.js';
import crypto from 'crypto';
import path from 'path';
import { normalizeStoredResumeSkills } from '../utils/skillNormalizer.js';
import { uploadResume, deleteResume, resumeExists } from '../services/resumeStorage.service.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPE = 'application/pdf';

function generateContentHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
}

function buildSkillsObject(candidateData) {
  return {
    programmingLanguages: candidateData.programmingLanguages || [],
    frameworks: candidateData.frameworks || [],
    databases: candidateData.databases || [],
    tools: candidateData.tools || [],
    cloud: candidateData.cloud || [],
    other: candidateData.skills || []
  };
}

function buildGridFSFilename(contentHash, originalName) {
  const ext = path.extname(originalName).toLowerCase() || '.pdf';
  const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '-');
  return `resume_${contentHash}_${safeBase}${ext}`;
}

export async function parseResume(req, res) {
  let newFileId = null;

  try {
    const userId = req.userId;

    if (!req.file) {
      return errorResponse(res, 'Resume file is required', 400);
    }

    if (req.file.mimetype !== ALLOWED_MIME_TYPE) {
      return errorResponse(res, 'Only PDF resumes are supported', 400);
    }

    if (req.file.size > MAX_FILE_SIZE) {
      return errorResponse(res, `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB`, 400);
    }

    const parser = new PDFParse({ data: req.file.buffer });
    const pdfData = await parser.getText();
    const text = pdfData.text.trim();

    if (!text) {
      return errorResponse(res, 'Could not extract text from PDF. The file may be scanned or image-based.', 400);
    }

    const contentHash = generateContentHash(text);

    const existingResume = await Resume.findOne({ userId, contentHash });
    if (existingResume) {
      console.log('[RESUME] Cached resume found for user');
      const migratedSkills = normalizeStoredResumeSkills(existingResume.toObject());

      if (JSON.stringify(migratedSkills) !== JSON.stringify(existingResume.skills)) {
        existingResume.skills = migratedSkills;
      }

      // Ensure the PDF is stored in GridFS
      if (!existingResume.fileId) {
        const filename = buildGridFSFilename(contentHash, req.file.originalname);
        newFileId = await uploadResume(req.file.buffer, filename);
        existingResume.fileId = newFileId;
        console.log('[RESUME] Migrated legacy resume to GridFS');
      } else {
        // Verify GridFS file still exists
        const exists = await resumeExists(existingResume.fileId);
        if (!exists) {
          const filename = buildGridFSFilename(contentHash, req.file.originalname);
          newFileId = await uploadResume(req.file.buffer, filename);
          existingResume.fileId = newFileId;
          console.log('[RESUME] Re-uploaded missing GridFS file');
        }
      }

      existingResume.originalFilename = req.file.originalname;
      await existingResume.save();

      return successResponse(res, 'Resume already parsed (cached)', {
        resumeId: existingResume._id,
        ...existingResume.toObject()
      });
    }

    // Delete old resumes for this user before creating new one
    const oldResumes = await Resume.find({ userId });
    for (const old of oldResumes) {
      if (old.fileId) {
        try { await deleteResume(old.fileId); } catch (e) {
          console.error(`[RESUME] Failed to delete old GridFS file: ${e.message}`);
        }
      }
    }
    await Resume.deleteMany({ userId });

    console.log('[AI] Parsing resume with AI...');
    const candidateData = await parseResumeWithAI(text);

    // Upload PDF to GridFS
    const filename = buildGridFSFilename(contentHash, req.file.originalname);
    newFileId = await uploadResume(req.file.buffer, filename);

    const resumeDoc = new Resume({
      userId,
      personal: candidateData.personal || {
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        location: candidateData.location,
        summary: candidateData.summary
      },
      skills: buildSkillsObject(candidateData),
      experience: candidateData.experience || [],
      education: candidateData.education || [],
      projects: candidateData.projects || [],
      certifications: candidateData.certifications || [],
      achievements: candidateData.achievements || [],
      github: candidateData.github,
      linkedin: candidateData.linkedin,
      portfolio: candidateData.portfolio,
      originalFilename: req.file.originalname,
      fileId: newFileId,
      contentHash
    });

    await resumeDoc.save();
    console.log('[RESUME] Saved new resume to database');

    return successResponse(res, 'Resume parsed and saved successfully', {
      resumeId: resumeDoc._id,
      ...resumeDoc.toObject()
    });
  } catch (error) {
    // Clean up newly uploaded GridFS file if save fails
    if (newFileId) {
      try { await deleteResume(newFileId); } catch (e) {
        console.error(`[RESUME] Cleanup failed for GridFS file ${newFileId}: ${e.message}`);
      }
    }
    console.error('Parse resume error:', error.message);
    return errorResponse(res, error.message || 'Failed to parse resume');
  }
}

export async function getResumeById(req, res) {
  try {
    const userId = req.userId;
    const resume = await Resume.findOne({ userId });

    if (!resume) {
      return errorResponse(res, 'Resume not found. Please upload your resume first.', 404);
    }

    const migratedSkills = normalizeStoredResumeSkills(resume.toObject());

    if (JSON.stringify(migratedSkills) !== JSON.stringify(resume.skills)) {
      resume.skills = migratedSkills;
      await resume.save();
    }

    return successResponse(res, 'Resume retrieved successfully', resume);
  } catch (error) {
    console.error('Get resume error:', error.message);
    return errorResponse(res, error.message || 'Failed to retrieve resume');
  }
}
