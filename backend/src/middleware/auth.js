import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { HttpError } from './errorHandler.js';

// JWT token yoxla + user-i req.user-ə yaz
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'TOKEN_MISSING');

    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query(
      'SELECT id, name, role, hr_code, username, is_blocked FROM users WHERE id = $1',
      [payload.id]
    );
    if (!rows[0])             throw new HttpError(401, 'USER_NOT_FOUND');
    if (rows[0].is_blocked)   throw new HttpError(403, 'USER_BLOCKED');

    req.user = rows[0];
    next();
  } catch (err) {
    if (err instanceof HttpError) return next(err);
    next(new HttpError(401, 'TOKEN_INVALID'));
  }
}

// Rol yoxlaması
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user)                   return next(new HttpError(401, 'UNAUTHENTICATED'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'FORBIDDEN'));
    next();
  };
}
