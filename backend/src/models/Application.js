import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  company: { type: String, default: '' },
  role: { type: String, default: '' },
  recipient: { type: String, default: '' },
  jobText: { type: String, default: '' },
  email: {
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
  },
  status: { type: String, enum: ['sent', 'failed', 'processing'], default: 'processing' },
  error: { type: String, default: null },
  timing: {
    fileRead: { type: String, default: null },
    smtp: { type: String, default: null },
    total: { type: String, default: null },
  },
  durationMs: { type: Number, default: null },
  applicationInstructions: [{ type: String }],
  subjectRequirement: { type: String, default: null },
  jobId: { type: String, default: null },
  referenceNumber: { type: String, default: null },
  instructionValidation: {
    subject: { type: String, default: null },
    problems: [String],
  },
  instructionValidationPassed: { type: Boolean, default: true },
}, { timestamps: true });

applicationSchema.index({ userId: 1, createdAt: -1 });

export const Application = mongoose.model('Application', applicationSchema);
