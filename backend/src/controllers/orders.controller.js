import Order from '../models/Order.js';
import { HttpError, asyncHandler } from '../middleware/errorHandler.js';
import { getIO } from '../config/socket.js';

// Müştəri — yeni sifariş
export const createOrder = asyncHandler(async (req, res) => {
  const { items, sessionId, notes } = req.body;
  if (!items?.length) throw new HttpError(400, 'CART_EMPTY');

  let order;
  try {
    order = await Order.create({ items, sessionId, notes });
  } catch (err) {
    if (err.message?.startsWith('PRODUCT_NOT_FOUND:'))  throw new HttpError(404, 'PRODUCT_NOT_FOUND');
    if (err.message?.startsWith('STOCK_INSUFFICIENT:')) throw new HttpError(422, 'STOCK_INSUFFICIENT');
    throw err;
  }

  // İşçilərə real-time bildiriş
  try {
    getIO().to('role:employee').emit('order:new', order);
  } catch {}

  res.status(201).json(order);
});

// Müştəri — sifariş statusunu yoxla
export const getOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ id: order.id, order_number: order.order_number, status: order.status });
});
