import { generateApplicationEmail } from '../services/ai.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function generateEmail(req, res) {
  try {
    const { job, resume, match, emailType } = req.body;

    if (!job) {
      return errorResponse(res, 'Job data is required', 400);
    }

    if (!resume) {
      return errorResponse(res, 'Resume data is required', 400);
    }

    if (!match) {
      return errorResponse(res, 'Match data is required', 400);
    }

    if (typeof job !== 'object' || job === null) {
      return errorResponse(res, 'Job data must be a valid object', 400);
    }

    if (typeof resume !== 'object' || resume === null) {
      return errorResponse(res, 'Resume data must be a valid object', 400);
    }

    if (typeof match !== 'object' || match === null) {
      return errorResponse(res, 'Match data must be a valid object', 400);
    }

    const type = emailType || 'APPLICATION';
    if (type !== 'APPLICATION') {
      return errorResponse(res, 'Only APPLICATION email type is supported currently', 400);
    }

    const emailData = await generateApplicationEmail(job, resume, match);

    return successResponse(res, 'Application email generated successfully', emailData);
  } catch (error) {
    console.error('Generate email error:', error.message);
    return errorResponse(res, error.message || 'Failed to generate application email');
  }
}