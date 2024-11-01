import { Router } from 'express';
import productRoutes from './productRoutes';
import { registerUser, loginUser } from '../services/authService'; 
import cartRoutes from './cartRoutes';
import orderRoutes from './orderRoutes';

const router = Router();

// Rotas de autenticação
router.post('/auth/register', registerUser); 
router.post('/auth/login', loginUser);

// Rotas de produtos
router.use('/products', productRoutes);

router.use('/orders', orderRoutes);
// router.post('/products', createProduct);
// router.put('/products/:id/stock', updateStock);
// router.put('/products/:id', updateProduct);
// router.route('/products').get(getAllProducts);
// router.route('/products/:id').get(getProductById);
// router.route('/products/:id').delete(deleteProduct)

// Rotas de carrinho
router.use('/cart', cartRoutes);

// Rotas de pedidos
// router.post('/orders', createOrderFromCart);
// router.get('/orders', getUserOrders);

export default router;
