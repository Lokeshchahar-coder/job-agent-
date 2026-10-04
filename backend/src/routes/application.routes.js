import { Router } from 'express';
import { getApplications, getApplicationById } from '../controllers/application.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateUser, getApplications);
router.get('/:id', authenticateUser, getApplicationById);

export default router;
