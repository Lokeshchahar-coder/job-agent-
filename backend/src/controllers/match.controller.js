import { matchJobWithResume } from '../services/match.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function matchJobResume(req, res) {
  try {
    const { job, resume } = req.body;

    if (!job) {
      return errorResponse(res, 'Job data is required', 400);
    }

    if (!resume) {
      return errorResponse(res, 'Resume data is required', 400);
    }

    if (typeof job !== 'object' || job === null) {
      return errorResponse(res, 'Job data must be a valid object', 400);
    }

    if (typeof resume !== 'object' || resume === null) {
      return errorResponse(res, 'Resume data must be a valid object', 400);
    }

    console.log('[MATCH] Running deterministic matcher (no AI call)');
    const matchResult = matchJobWithResume(job, resume);

    return successResponse(res, 'Match analysis completed', matchResult);
  } catch (error) {
    console.error('Match job-resume error:', error.message);
    return errorResponse(res, error.message || 'Failed to analyze job-resume match');
  }
}