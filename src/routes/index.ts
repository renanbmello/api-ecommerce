import { Router } from 'express';
import { createProduct, deleteProduct, getAllProducts, getProductById, updateProduct, updateStock } from '../controllers/productController';
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
router.put('/products/:id', updateProduct);
router.route('/products').get(getAllProducts);
router.route('/products/:id').get(getProductById);
router.route('product/:id').delete(deleteProduct)


// Rotas de carrinho
// router.post('/cart', addToCart);
// router.delete('/cart', removeFromCart);
// router.get('/cart', getCartProducts);

// Rotas de pedidos
// router.post('/orders', createOrderFromCart);
// router.get('/orders', getUserOrders);

export default router;
