import { Router } from 'express';
import { createOrderFromCart } from '../controllers/order/createOrderFromCart';
import { authenticateToken } from '../middleware/authMiddleware';
const router = Router();

router.post('/', authenticateToken, createOrderFromCart);

export default router;

