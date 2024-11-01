import { Router } from 'express';
import { createOrderFromCart } from '../controllers/order/createOrderFromCart';
import { authenticateToken } from '../middleware/authMiddleware';
import { getOrderById } from '../controllers/order/GetOrderById';
const router = Router();

router.post('/', authenticateToken, createOrderFromCart);
router.get('/:id', authenticateToken, getOrderById);
export default router;

