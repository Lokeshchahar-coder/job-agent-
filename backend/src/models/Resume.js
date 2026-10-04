import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  personal: {
    name: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    location: { type: String, default: null },
    summary: { type: String, default: null }
  },
  skills: {
    programmingLanguages: [{ type: String }],
    frameworks: [{ type: String }],
    databases: [{ type: String }],
    tools: [{ type: String }],
    cloud: [{ type: String }],
    other: [{ type: String }]
  },
  experience: [{
    title: { type: String, default: null },
    company: { type: String, default: null },
    location: { type: String, default: null },
    duration: { type: String, default: null },
    description: { type: String, default: null },
    skills: [{ type: String }]
  }],
  education: [{
    degree: { type: String, default: null },
    institution: { type: String, default: null },
    year: { type: String, default: null },
    details: { type: String, default: null }
  }],
  projects: [{
    name: { type: String, default: null },
    description: { type: String, default: null },
    technologies: [{ type: String }],
    link: { type: String, default: null }
  }],
  certifications: [{
    name: { type: String, default: null },
    issuer: { type: String, default: null },
    year: { type: String, default: null }
  }],
  achievements: [{ type: String }],
  github: { type: String, default: null },
  linkedin: { type: String, default: null },
  portfolio: { type: String, default: null },
  originalFilename: { type: String, default: null },
  filePath: { type: String, default: null },
  fileId: { type: mongoose.Schema.Types.ObjectId, default: null },
  contentHash: { type: String, index: true }
}, {
  timestamps: true
});

resumeSchema.index({ userId: 1 });
resumeSchema.index({ 'personal.email': 1 });

export const Resume = mongoose.model('Resume', resumeSchema);