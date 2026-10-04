import express from 'express';
import { generateEmail } from '../controllers/email.controller.js';

const router = express.Router();

router.post('/generate', generateEmail);

export default router;