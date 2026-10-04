import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  company: { type: String, default: null },
  role: { type: String, default: null },
  location: { type: String, default: null },
  workMode: { type: String, default: null },
  salary: { type: String, default: null },
  experience: { type: String, default: null },
  eligibility: [{ type: String }],
  skills: [{
    name: { type: String, required: true },
    required: { type: Boolean, default: true }
  }],
  description: { type: String, default: null },
  email: { type: String, default: null },
  applyLink: { type: String, default: null },
  rawText: { type: String, default: null },
  contentHash: { type: String, index: true }
}, {
  timestamps: true
});

jobSchema.index({ company: 1, role: 1 });

export const Job = mongoose.model('Job', jobSchema);