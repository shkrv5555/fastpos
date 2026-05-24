import Product from '../models/Product.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Public — müştəri üçün menyü
export const getProducts = asyncHandler(async (req, res) => {
  const { segment, category_id, search } = req.query;
  const products = await Product.findAll({ segment, categoryId: category_id, search });
  res.json(products);
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(product);
});
