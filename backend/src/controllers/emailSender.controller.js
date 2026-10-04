import { sendEmail } from '../services/email.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendEmailController(req, res) {
  try {
    const { recipient, subject, body, resumePath } = req.body;

    if (!recipient) {
      return errorResponse(res, 'Recipient email is required', 400);
    }

    if (!EMAIL_REGEX.test(recipient)) {
      return errorResponse(res, 'Invalid recipient email address', 400);
    }

    if (!subject || typeof subject !== 'string' || subject.trim() === '') {
      return errorResponse(res, 'Subject is required', 400);
    }

    if (!body || typeof body !== 'string' || body.trim() === '') {
      return errorResponse(res, 'Email body is required', 400);
    }

    if (!resumePath) {
      return errorResponse(res, 'Resume path is required', 400);
    }

    const result = await sendEmail({
      recipient: recipient.trim(),
      subject: subject.trim(),
      body: body.trim(),
      resumePath: resumePath.trim()
    });

    return successResponse(res, 'Email sent successfully', result);
  } catch (error) {
    console.error('Send email error:', error.message);
    return errorResponse(res, error.message || 'Failed to send email');
  }
}