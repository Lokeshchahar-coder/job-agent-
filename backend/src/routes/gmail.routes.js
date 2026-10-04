import { Router } from 'express';
import { getGmailStatus, disconnectGmail } from '../controllers/gmail.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

router.get('/account', authenticateUser, getGmailStatus);
router.delete('/account', authenticateUser, disconnectGmail);

export default router;
