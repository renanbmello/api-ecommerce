import { Router } from 'express';
import { createProduct, updateProduct } from '../controllers/product';
import { validateRequest } from '../middleware/validateRequest';
import { 
    createProductRouteSchema, 
    updateProductRouteSchema 
} from '../schemas/routeSchemas';

const router = Router();

router.post(
    '/',
    validateRequest(createProductRouteSchema),
    createProduct
);

router.put(
    '/:id',
    validateRequest(updateProductRouteSchema),
    updateProduct
);

export default router;

