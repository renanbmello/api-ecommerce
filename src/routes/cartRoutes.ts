import express from 'express';
import { addToCart, getCart, removeFromCart } from '../controllers/cartController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authenticateToken middleware to protect these routes
router.post('/', authenticateToken, addToCart);
router.get('/', authenticateToken, getCart);
router.delete('/:productId', authenticateToken, removeFromCart);

export default router;
