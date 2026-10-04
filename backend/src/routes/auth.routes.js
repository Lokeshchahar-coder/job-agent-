import { Router } from 'express';
import { signup, login, getMe, updateProfile } from '../controllers/auth.controller.js';
import { getGoogleAuthUrl, googleCallback } from '../controllers/gmail.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateUser, getMe);
router.put('/profile', authenticateUser, updateProfile);

router.get('/google', authenticateUser, getGoogleAuthUrl);
router.get('/google/callback', googleCallback);

export default router;
