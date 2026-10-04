import express from 'express';
import { parseJob, getJobById } from '../controllers/job.controller.js';

const router = express.Router();

router.post('/parse', parseJob);
router.get('/:jobId', getJobById);

export default router;