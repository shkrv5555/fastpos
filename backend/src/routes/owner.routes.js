import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  validateCreateProduct, validateUpdateProduct,
  validateCreateDiscount, validateUpdateDiscount,
  validateCreateEmployee, validateUpdateEmployee,
} from '../middleware/validate.js';
import {
  getStats, getTopProducts,
  getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage,
  getCategories, createCategory,
  getIngredients, createIngredient,
  getDiscounts, createDiscount, updateDiscount, toggleDiscount, deleteDiscount,
  getEmployees, createEmployee, updateEmployee, blockEmployee, deleteEmployee,
  getEditRequests, approveEditRequest, rejectEditRequest,
  getStockHistory,
} from '../controllers/owner.controller.js';

const router = Router();
router.use(authenticate, requireRole('owner'));

// Statistika
router.get('/stats',        getStats);
router.get('/top-products', getTopProducts);

// Məhsullar
router.get('/products',                      getProducts);
router.post('/products',                     validateCreateProduct, createProduct);
router.put('/products/:id',                  validateUpdateProduct, updateProduct);
router.delete('/products/:id',               deleteProduct);
router.post('/products/:id/image',           upload.single('image'), uploadProductImage);

// Kateqoriyalar
router.get('/categories',  getCategories);
router.post('/categories', createCategory);

// İnqredientlər
router.get('/ingredients',  getIngredients);
router.post('/ingredients', createIngredient);

// Endirimlər
router.get('/discounts',              getDiscounts);
router.post('/discounts',             validateCreateDiscount, createDiscount);
router.put('/discounts/:id',          validateUpdateDiscount, updateDiscount);
router.patch('/discounts/:id/toggle', toggleDiscount);
router.delete('/discounts/:id',       deleteDiscount);

// İşçilər
router.get('/employees',             getEmployees);
router.post('/employees',            validateCreateEmployee, createEmployee);
router.put('/employees/:id',         validateUpdateEmployee, updateEmployee);
router.patch('/employees/:id/block', blockEmployee);
router.delete('/employees/:id',      deleteEmployee);

// Redaktə icazəsi
router.get('/edit-requests',               getEditRequests);
router.patch('/edit-requests/:id/approve', approveEditRequest);
router.patch('/edit-requests/:id/reject',  rejectEditRequest);

// Stok tarixçəsi
router.get('/stock-history', getStockHistory);

export default router;
