import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  validateConfirmOrder, validateUpdateStatus,
  validateStockIntake, validateEditRequest,
} from '../middleware/validate.js';
import {
  getActiveOrders, confirmOrder, updateOrderStatus,
  addStockIntake, getMyStockHistory, requestEdit,
} from '../controllers/employee.controller.js';

const router = Router();
router.use(authenticate, requireRole('employee'));

router.get('/orders',               getActiveOrders);
router.patch('/orders/:id/confirm', validateConfirmOrder, confirmOrder);
router.patch('/orders/:id/status',  validateUpdateStatus, updateOrderStatus);
router.post('/stock',               validateStockIntake,  addStockIntake);
router.get('/stock-history',                              getMyStockHistory);
router.post('/edit-requests',       validateEditRequest,  requestEdit);

export default router;
