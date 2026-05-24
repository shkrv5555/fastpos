import Order from '../models/Order.js';
import Product from '../models/Product.js';
import EditRequest from '../models/EditRequest.js';
import pool from '../config/database.js';
import { HttpError, asyncHandler } from '../middleware/errorHandler.js';
import { getIO } from '../config/socket.js';

// Aktiv sifarişlər
export const getActiveOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findActive();
  res.json(orders);
});

// Sifariş təsdiqlə + ödəniş tipini seç
export const confirmOrder = asyncHandler(async (req, res) => {
  const { paymentType } = req.body;
  if (!['cash', 'card'].includes(paymentType)) throw new HttpError(400, 'INVALID_PAYMENT_TYPE');

  const order = await Order.setPaymentAndConfirm(req.params.id, paymentType, req.user.id);
  if (!order) throw new HttpError(404, 'ORDER_NOT_FOUND_OR_ALREADY_PROCESSED');

  // Müştəriyə status dəyişikliyi bildiriş
  try {
    getIO().to(`session:${order.session_id}`).emit('order:status-changed', {
      orderId: order.id, status: order.status,
    });
  } catch {}

  res.json(order);
});

// Status yenilə (preparing → ready → completed)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['preparing', 'ready', 'completed', 'cancelled'];
  if (!allowed.includes(status)) throw new HttpError(400, 'INVALID_STATUS');

  const order = await Order.updateStatus(req.params.id, status, req.user.id);
  if (!order) throw new HttpError(404, 'NOT_FOUND');

  try {
    getIO().to(`session:${order.session_id}`).emit('order:status-changed', {
      orderId: order.id, status: order.status,
    });
  } catch {}

  res.json(order);
});

// Stok daxil et
export const addStockIntake = asyncHandler(async (req, res) => {
  const { productId, quantity, notes } = req.body;
  if (!productId || !quantity || quantity <= 0) throw new HttpError(400, 'INVALID_DATA');

  const product = await Product.findById(productId);
  if (!product) throw new HttpError(404, 'PRODUCT_NOT_FOUND');

  await Product.increaseStock(productId, quantity);
  await pool.query(
    'INSERT INTO stock_intakes (employee_id, product_id, quantity, notes) VALUES ($1, $2, $3, $4)',
    [req.user.id, productId, quantity, notes]
  );

  res.json({ message: 'STOCK_ADDED', productId, quantity });
});

// Öz stok daxiletmə tarixçəsi
export const getMyStockHistory = asyncHandler(async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit)  || 30, 100);
  const offset = parseInt(req.query.offset) || 0;
  const { rows } = await pool.query(`
    SELECT si.*, p.name AS product_name
    FROM stock_intakes si
    JOIN products p ON p.id = si.product_id
    WHERE si.employee_id = $1
    ORDER BY si.created_at DESC
    LIMIT $2 OFFSET $3
  `, [req.user.id, limit, offset]);
  res.json(rows);
});

// Redaktə icazəsi sorğusu
export const requestEdit = asyncHandler(async (req, res) => {
  const { productId, requestedChanges, comment } = req.body;
  if (!productId || !requestedChanges || !comment) throw new HttpError(400, 'INVALID_DATA');

  const request = await EditRequest.create({
    employeeId: req.user.id, productId, requestedChanges, comment,
  });
  res.status(201).json(request);
});
