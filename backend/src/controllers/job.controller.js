import { parseJobWithAI } from '../services/ai.service.js';
import { Job } from '../models/Job.js';
import { successResponse, errorResponse } from '../utils/response.js';
import crypto from 'crypto';
import { normalizeJobSkills } from '../utils/skillNormalizer.js';

const MAX_TEXT_LENGTH = 20000;

function generateContentHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
}

export async function parseJob(req, res) {
  try {
    const { text } = req.body;

    if (!text) {
      return errorResponse(res, 'Job notification text is required', 400);
    }

    if (typeof text !== 'string') {
      return errorResponse(res, 'Job notification text must be a string', 400);
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return errorResponse(res, 'Job notification text cannot be empty', 400);
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return errorResponse(res, `Job notification text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`, 400);
    }

    const contentHash = generateContentHash(trimmedText);
    
    const existingJob = await Job.findOne({ contentHash });
    if (existingJob) {
      console.log('[JOB] Cached job found');
      const migratedSkills = normalizeJobSkills(existingJob.toObject());
      if (JSON.stringify(migratedSkills) !== JSON.stringify(existingJob.skills)) {
        console.log('[JOB] Migrating cached job skills');
        existingJob.skills = migratedSkills;
        await existingJob.save();
      }
      
      return successResponse(res, 'Job already parsed (cached)', {
        jobId: existingJob._id,
        ...existingJob.toObject()
      });
    }

    console.log('[AI] Parsing job with AI...');
    const jobData = await parseJobWithAI(trimmedText);

    const jobDoc = new Job({
      company: jobData.company,
      role: jobData.role,
      location: jobData.location,
      workMode: jobData.workMode,
      salary: jobData.salary,
      experience: jobData.experience,
      eligibility: jobData.eligibility || [],
      skills: jobData.skills || [],
      description: jobData.description,
      email: jobData.email,
      applyLink: jobData.applyLink,
      rawText: trimmedText,
      contentHash
    });

    await jobDoc.save();
    console.log('[JOB] Saved new job to database');

    return successResponse(res, 'Job parsed and saved successfully', {
      jobId: jobDoc._id,
      ...jobDoc.toObject()
    });
  } catch (error) {
    console.error('Parse job error:', error.message);
    return errorResponse(res, error.message || 'Failed to parse job notification');
  }
}

export async function getJobById(req, res) {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return errorResponse(res, 'Job ID is required', 400);
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return errorResponse(res, 'Job not found', 404);
    }

    const migratedSkills = normalizeJobSkills(job.toObject());
    if (JSON.stringify(migratedSkills) !== JSON.stringify(job.skills)) {
      console.log('[JOB] Migrating cached job skills');
      job.skills = migratedSkills;
      await job.save();
    }

    return successResponse(res, 'Job retrieved successfully', job);
  } catch (error) {
    console.error('Get job error:', error.message);
    return errorResponse(res, error.message || 'Failed to retrieve job');
  }
}