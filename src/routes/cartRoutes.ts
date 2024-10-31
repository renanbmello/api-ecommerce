import express from 'express';
import { addToCart, calculateCartTotal, getCart, removeFromCart, clearCart } from '../controllers/cartController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authenticateToken middleware to protect these routes
router.post('/', authenticateToken, addToCart);
router.get('/', authenticateToken, getCart);
router.delete('/:productId', authenticateToken, removeFromCart);
router.delete('/', authenticateToken, clearCart);
router.get('/total', authenticateToken, calculateCartTotal);


export default router;
