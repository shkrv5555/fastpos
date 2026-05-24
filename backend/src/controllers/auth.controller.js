import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { HttpError, asyncHandler } from '../middleware/errorHandler.js';

function signToken(user, expiresIn) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

// Owner giriş
export const ownerLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) throw new HttpError(400, 'MISSING_CREDENTIALS');

  const user = await User.findByUsername(username);
  if (!user) throw new HttpError(401, 'INVALID_CREDENTIALS');
  if (user.is_blocked) throw new HttpError(403, 'USER_BLOCKED');

  const valid = await User.verifyPassword(password, user.password_hash);
  if (!valid) throw new HttpError(401, 'INVALID_CREDENTIALS');

  const token = signToken(user, process.env.JWT_EXPIRES_IN || '24h');
  res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role },
  });
});

// İşçi giriş (HR kodu + şifrə)
export const employeeLogin = asyncHandler(async (req, res) => {
  const { hrCode, password } = req.body;
  if (!hrCode || !password) throw new HttpError(400, 'MISSING_CREDENTIALS');

  const user = await User.findByHrCode(hrCode);
  if (!user) throw new HttpError(401, 'INVALID_CREDENTIALS');

  const valid = await User.verifyPassword(password, user.password_hash);
  if (!valid) throw new HttpError(401, 'INVALID_CREDENTIALS');

  const token = signToken(user, process.env.JWT_EMPLOYEE_EXPIRES_IN || '8h');
  res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role, hrCode: user.hr_code },
  });
});
