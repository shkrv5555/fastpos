import { Router } from 'express';
import { createOrder, getOrderStatus } from '../controllers/orders.controller.js';
import { validateCreateOrder } from '../middleware/validate.js';

const router = Router();

router.post('/',          validateCreateOrder, createOrder);
router.get('/:id/status', getOrderStatus);

export default router;
