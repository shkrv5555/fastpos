import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateAiChat } from '../middleware/validate.js';
import { chat } from '../controllers/ai.controller.js';

const router = Router();

router.post('/chat', authenticate, requireRole('owner'), validateAiChat, chat);

export default router;
