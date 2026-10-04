import express from 'express';
import multer from 'multer';
import { parseResume, getResumeById } from '../controllers/resume.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

router.post('/parse', authenticateUser, upload.single('resume'), parseResume);
router.get('/', authenticateUser, getResumeById);

export default router;
