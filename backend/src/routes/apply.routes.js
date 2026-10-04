import express from 'express';
import { apply } from '../controllers/apply.controller.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateUser, apply);

export default router;
