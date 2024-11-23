import { Router } from 'express';
import { 
    createProduct, 
    getAllProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct,
    updateStock 
} from '../controllers/product';
import { validateRequest } from '../middleware/validateRequest';
import { 
    createProductSchema,
    updateProductSchema,
    getProductSchema,
    listProductsSchema,
    updateStockSchema
} from '../schemas/productSchema';

const router = Router();

router.get(
    '/',
    validateRequest(listProductsSchema),
    getAllProducts
);

router.get(
    '/:productId',
    validateRequest(getProductSchema),
    getProductById
);

router.post(
    '/',
    validateRequest(createProductSchema),
    createProduct
);

router.put(
    '/:productId',
    validateRequest(updateProductSchema),
    updateProduct
);

router.delete(
    '/:productId',
    validateRequest(getProductSchema),
    deleteProduct
);

router.patch(
    '/:productId/stock',
    validateRequest(updateStockSchema),
    updateStock
);

export default router;

