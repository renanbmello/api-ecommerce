import { Router } from 'express';
import { createOrderFromCart } from '../controllers/order/createOrderFromCart';
import { authenticateToken } from '../middleware/authMiddleware';
import { getOrderById } from '../controllers/order/GetOrderById';
import { getAllOrders } from '../controllers/order/GetAllOrders';
import { updateOrder } from '../controllers/order/UpdateOrder';
import { deleteOrder } from '../controllers/order/deleteOrder';

const router = Router();

router.post('/', authenticateToken, createOrderFromCart);
router.get('/:id', authenticateToken, getOrderById);
router.get('/', authenticateToken, getAllOrders);
router.put('/:id', authenticateToken, updateOrder);
router.delete('/:id', authenticateToken, deleteOrder);

export default router;

