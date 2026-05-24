import Product from '../models/Product.js';
import User from '../models/User.js';
import Discount from '../models/Discount.js';
import EditRequest from '../models/EditRequest.js';
import Order from '../models/Order.js';
import pool from '../config/database.js';
import { HttpError, asyncHandler } from '../middleware/errorHandler.js';
import { processProductImage } from '../middleware/upload.js';

// ─── Statistika ───────────────────────────────────────────────────────────────

export const getStats = asyncHandler(async (req, res) => {
  const { period = 'today', year, month } = req.query;
  let data;

  if (period === 'today') {
    const today = new Date().toISOString().split('T')[0];
    data = await Order.getDailyStats(today);
  } else if (period === 'week') {
    data = await Order.getWeeklyStats();
  } else if (period === 'month') {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    data = await Order.getMonthlyStats(y, m);
  } else {
    throw new HttpError(400, 'INVALID_PERIOD');
  }

  res.json(data);
});

export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const { rows } = await pool.query('SELECT * FROM top_selling_products LIMIT $1', [limit]);
  res.json(rows);
});

// ─── Məhsul idarəetməsi ───────────────────────────────────────────────────────

export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.findAll({ ...req.query, ownerView: true });
  res.json(products);
});

export const createProduct = asyncHandler(async (req, res) => {
  const { ingredients, ...productData } = req.body;
  const product = await Product.create(productData);
  if (Array.isArray(ingredients) && ingredients.length) {
    await Product.syncIngredients(product.id, ingredients);
  }
  const full = await Product.findById(product.id);
  res.status(201).json(full);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { ingredients, ...productData } = req.body;
  const product = await Product.update(req.params.id, productData);
  if (!product) throw new HttpError(404, 'NOT_FOUND');
  if (Array.isArray(ingredients)) {
    await Product.syncIngredients(product.id, ingredients);
  }
  const full = await Product.findById(product.id);
  res.json(full);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT id FROM products WHERE id = $1', [req.params.id]);
  if (!rows[0]) throw new HttpError(404, 'NOT_FOUND');
  await Product.delete(req.params.id);
  res.json({ message: 'DELETED' });
});

export const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'NO_FILE_UPLOADED');
  const imageUrl = await processProductImage(req.file.buffer);
  await pool.query('UPDATE products SET image_url = $1 WHERE id = $2', [imageUrl, req.params.id]);
  res.json({ imageUrl });
});

// ─── Kateqoriyalar ────────────────────────────────────────────────────────────

export const getCategories = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY sort_order, name');
  res.json(rows);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, sortOrder } = req.body;
  if (!name?.trim()) throw new HttpError(400, 'NAME_REQUIRED');
  const { rows } = await pool.query(
    'INSERT INTO categories (name, sort_order) VALUES ($1, $2) RETURNING *',
    [name.trim(), sortOrder || 0]
  );
  res.status(201).json(rows[0]);
});

// ─── İnqredientlər ───────────────────────────────────────────────────────────

export const getIngredients = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM ingredients ORDER BY name');
  res.json(rows);
});

export const createIngredient = asyncHandler(async (req, res) => {
  const { name, unit } = req.body;
  if (!name?.trim()) throw new HttpError(400, 'NAME_REQUIRED');
  const { rows } = await pool.query(
    'INSERT INTO ingredients (name, unit) VALUES ($1, $2) RETURNING *',
    [name.trim(), unit || 'q']
  );
  res.status(201).json(rows[0]);
});

// ─── Endirimlər ───────────────────────────────────────────────────────────────

export const getDiscounts = asyncHandler(async (req, res) => {
  const discounts = await Discount.findAll();
  res.json(discounts);
});

export const createDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json(discount);
});

export const updateDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.update(req.params.id, req.body);
  if (!discount) throw new HttpError(404, 'NOT_FOUND');
  res.json(discount);
});

export const toggleDiscount = asyncHandler(async (req, res) => {
  const discount = await Discount.toggle(req.params.id);
  if (!discount) throw new HttpError(404, 'NOT_FOUND');
  res.json(discount);
});

export const deleteDiscount = asyncHandler(async (req, res) => {
  await Discount.delete(req.params.id);
  res.json({ message: 'DELETED' });
});

// ─── İşçi idarəetməsi ────────────────────────────────────────────────────────

export const getEmployees = asyncHandler(async (req, res) => {
  const employees = await User.getAllEmployees();
  res.json(employees);
});

export const createEmployee = asyncHandler(async (req, res) => {
  const { name, hrCode, password } = req.body;
  const employee = await User.createEmployee({ name, hrCode, password });
  res.status(201).json(employee);
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await User.update(req.params.id, req.body);
  if (!employee) throw new HttpError(404, 'NOT_FOUND');
  res.json(employee);
});

export const blockEmployee = asyncHandler(async (req, res) => {
  const { blocked } = req.body;
  if (typeof blocked !== 'boolean') throw new HttpError(400, 'BLOCKED_MUST_BE_BOOLEAN');
  const employee = await User.setBlocked(req.params.id, blocked);
  if (!employee) throw new HttpError(404, 'NOT_FOUND');
  res.json(employee);
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id FROM users WHERE id = $1 AND role = 'employee'",
    [req.params.id]
  );
  if (!rows[0]) throw new HttpError(404, 'NOT_FOUND');
  await User.delete(req.params.id);
  res.json({ message: 'DELETED' });
});

// ─── Redaktə icazəsi sorğuları ────────────────────────────────────────────────

export const getEditRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const allowed = ['pending', 'approved', 'rejected'];
  const requests = await EditRequest.findAll(allowed.includes(status) ? status : null);
  res.json(requests);
});

export const approveEditRequest = asyncHandler(async (req, res) => {
  const request = await EditRequest.approve(req.params.id, req.user.id);
  if (!request) throw new HttpError(404, 'NOT_FOUND_OR_ALREADY_REVIEWED');
  res.json(request);
});

export const rejectEditRequest = asyncHandler(async (req, res) => {
  const request = await EditRequest.reject(req.params.id, req.user.id);
  if (!request) throw new HttpError(404, 'NOT_FOUND_OR_ALREADY_REVIEWED');
  res.json(request);
});

// ─── Stok tarixçəsi ───────────────────────────────────────────────────────────

export const getStockHistory = asyncHandler(async (req, res) => {
  const { productId, limit = 50, offset = 0 } = req.query;
  const params = [parseInt(limit), parseInt(offset)];
  let where = '';
  if (productId) {
    params.unshift(productId);
    where = 'WHERE si.product_id = $1';
  }

  const { rows } = await pool.query(`
    SELECT
      si.*,
      p.name  AS product_name,
      u.name  AS employee_name,
      u.hr_code
    FROM stock_intakes si
    JOIN products p ON p.id = si.product_id
    JOIN users u    ON u.id = si.employee_id
    ${where}
    ORDER BY si.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `, params);

  res.json(rows);
});
