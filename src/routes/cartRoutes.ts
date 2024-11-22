import express from 'express';
import { addToCart, 
    calculateCartTotal,
    getCart,
    removeFromCart,
    clearCart,
    applyDiscount
} from '../controllers/cart';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authenticateToken, addToCart);
router.get('/', authenticateToken, getCart);
router.delete('/:productId', authenticateToken, removeFromCart);
router.delete('/', authenticateToken, clearCart);
router.get('/total', authenticateToken, calculateCartTotal);
router.post('/discount', authenticateToken, applyDiscount);


export default router;
