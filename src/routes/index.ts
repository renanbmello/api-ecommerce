import { Router } from 'express';
import { createProduct, updateStock } from '../controllers/productController';
import { registerUser, loginUser } from '../services/authService'; 
import { addToCart, removeFromCart, getCartProducts } from '../controllers/cartController';
import { createOrderFromCart, getUserOrders } from '../controllers/orderController';

const router = Router();

// Rotas de autenticação
router.post('/auth/register', registerUser); 
router.post('/auth/login', loginUser);

// Rotas de produtos
router.post('/products', createProduct);
router.put('/products/:id/stock', updateStock);

// Rotas de carrinho
// router.post('/cart', addToCart);
// router.delete('/cart', removeFromCart);
// router.get('/cart', getCartProducts);

// Rotas de pedidos
// router.post('/orders', createOrderFromCart);
// router.get('/orders', getUserOrders);

export default router;
