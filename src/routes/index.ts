import { Router } from 'express';
import productRoutes from './productRoutes';
import { registerUser, loginUser } from '../services/authService'; 
import cartRoutes from './cartRoutes';
import orderRoutes from './orderRoutes';
import { registerSchema, loginSchema } from '../schemas/authSchema';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.post('/auth/register', validateRequest(registerSchema), registerUser); 
router.post('/auth/login', validateRequest(loginSchema), loginUser);

router.use('/products', productRoutes);

router.use('/orders', orderRoutes);


router.use('/cart', cartRoutes);



export default router;
