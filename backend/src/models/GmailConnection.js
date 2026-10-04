import mongoose from 'mongoose';

const gmailConnectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  provider: { type: String, default: 'google' },
  email: { type: String, required: true, lowercase: true },
  accessToken: { type: String, required: true, select: false },
  refreshToken: { type: String, required: true, select: false },
  tokenExpiry: { type: Date, required: true },
}, { timestamps: true });

gmailConnectionSchema.index({ userId: 1 }, { unique: true });

export const GmailConnection = mongoose.model('GmailConnection', gmailConnectionSchema);
