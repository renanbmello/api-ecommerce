import { Router } from 'express';
import productRoutes from './productRoutes';
import { registerUser, loginUser } from '../services/authService'; 
import cartRoutes from './cartRoutes';
import orderRoutes from './orderRoutes';

const router = Router();

router.post('/auth/register', registerUser); 
router.post('/auth/login', loginUser);

router.use('/products', productRoutes);

router.use('/orders', orderRoutes);


router.use('/cart', cartRoutes);



export default router;
