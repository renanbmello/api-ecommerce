import express from 'express';
import { addToCart, calculateCartTotal, getCart, removeFromCart } from '../controllers/cartController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authenticateToken middleware to protect these routes
router.post('/', authenticateToken, addToCart);
router.get('/', authenticateToken, getCart);
router.delete('/:productId', authenticateToken, removeFromCart);
router.get('/total', authenticateToken, calculateCartTotal);

export default router;
