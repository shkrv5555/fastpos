import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { initSocket } from './src/config/socket.js';
import { errorHandler } from './src/middleware/errorHandler.js';

// Route-lar
import authRoutes       from './src/routes/auth.routes.js';
import productsRoutes   from './src/routes/products.routes.js';
import ordersRoutes     from './src/routes/orders.routes.js';
import employeeRoutes   from './src/routes/employee.routes.js';
import ownerRoutes      from './src/routes/owner.routes.js';
import aiRoutes         from './src/routes/ai.routes.js';

const app = express();
const httpServer = createServer(app);

// ─── Socket.io başlat ─────────────────────────────────────────────────────────
initSocket(httpServer);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));

app.use(cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Ümumi rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '200'),
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders',   ordersRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/owner',    ownerRoutes);
app.use('/api/ai',       aiRoutes);

// Health check
app.get('/health', (_, res) => res.json({
  status: 'ok',
  uptime: process.uptime(),
  env: process.env.NODE_ENV,
}));

// 404
app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

// Global error handler
app.use(errorHandler);

// ─── Server başlat ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 FastPOS backend http://localhost:${PORT}`);
});
