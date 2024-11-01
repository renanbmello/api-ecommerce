import express from 'express';
import { createProduct, 
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    updateStock } from '../controllers/product';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authenticateToken, createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', authenticateToken, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);
router.post('/:id/stock', authenticateToken, updateStock);

export default router;

