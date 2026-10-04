import express from 'express';
import { matchJobResume } from '../controllers/match.controller.js';

const router = express.Router();

router.post('/', matchJobResume);

export default router;