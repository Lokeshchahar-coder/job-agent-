import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jobRoutes from './routes/job.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import matchRoutes from './routes/match.routes.js';
import emailRoutes from './routes/email.routes.js';
import emailSenderRoutes from './routes/emailSender.routes.js';
import applyRoutes from './routes/apply.routes.js';
import authRoutes from './routes/auth.routes.js';
import gmailRoutes from './routes/gmail.routes.js';
import applicationRoutes from './routes/application.routes.js';
import { successResponse } from './utils/response.js';
import { warmUpTransporter } from './services/email.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-application-agent';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[DB] MongoDB connected successfully');
  } catch (error) {
    console.error('[DB] MongoDB connection error:', error.message);
    process.exit(1);
  }
}

connectDB();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  successResponse(res, 'Job Application Agent backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/email', emailSenderRoutes);
app.use('/api/apply', applyRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/applications', applicationRoutes);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Auth: POST http://localhost:${PORT}/api/auth/signup | /login | /me`);
  console.log(`Resume: POST http://localhost:${PORT}/api/resume/parse`);
  console.log(`Gmail: GET http://localhost:${PORT}/api/gmail/google`);
  console.log(`Apply: POST http://localhost:${PORT}/api/apply`);
  console.log(`Applications: GET http://localhost:${PORT}/api/applications`);

  warmUpTransporter().catch(() => {});
});

export default app;
