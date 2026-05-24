import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ownerLogin, employeeLogin } from '../controllers/auth.controller.js';
import { validateOwnerLogin, validateEmployeeLogin } from '../middleware/validate.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10'),
  message: { error: 'TOO_MANY_ATTEMPTS', retryAfter: '15 dəqiqə' },
});

router.post('/owner-login',    authLimiter, validateOwnerLogin,    ownerLogin);
router.post('/employee-login', authLimiter, validateEmployeeLogin, employeeLogin);

export default router;
