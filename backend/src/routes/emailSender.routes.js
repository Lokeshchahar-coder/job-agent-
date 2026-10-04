import express from 'express';
import { sendEmailController } from '../controllers/emailSender.controller.js';

const router = express.Router();

router.post('/send', sendEmailController);

export default router;