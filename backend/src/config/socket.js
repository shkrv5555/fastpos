import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { registerOrderHandlers } from '../sockets/orders.handler.js';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
      credentials: true,
    },
  });

  // Socket auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Anonim müştəri — session ID ilə
      socket.userId = null;
      socket.userRole = 'customer';
      socket.sessionId = socket.handshake.auth?.sessionId;
      return next();
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId   = payload.id;
      socket.userRole = payload.role;
      next();
    } catch {
      next(new Error('TOKEN_INVALID'));
    }
  });

  io.on('connection', (socket) => {
    // Öz otağına qoşul
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      socket.join(`role:${socket.userRole}`);
    } else if (socket.sessionId) {
      socket.join(`session:${socket.sessionId}`);
    }

    registerOrderHandlers(io, socket);

    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io hələ başladılmayıb');
  return io;
}
