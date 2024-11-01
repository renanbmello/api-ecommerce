// import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export const createOrderFromCart = async (req: Request, res: Response) => {
//   const { userId } = req.body;

//   // Verificar se o carrinho do usuário existe e contém produtos
//   const cart = await prisma.cart.findUnique({
//     where: { userId },
//     include: { products: true }
//   });
//   if (!cart || cart.products.length === 0) {
//     return res.status(400).json({ message: 'Cart is empty or not found' });
//   }

//   // Criar o pedido
//   const order = await prisma.order.create({
//     data: {
//       userId,
//       status: 'PENDING', // Padrão para novos pedidos
//       products: {
//         create: cart.products.map((cartProduct) => ({
//           productId: cartProduct.productId
//         }))
//       }
//     }
//   });

//   // Limpar o carrinho após criar o pedido
//   await prisma.cartProduct.deleteMany({
//     where: { cartId: cart.id }
//   });

//   res.json(order);
// };

// export const getUserOrders = async (req: Request, res: Response) => {
//   const { userId } = req.body;

//   const orders = await prisma.order.findMany({
//     where: { userId },
//     include: {
//       products: {
//         include: {
//           product: true
//         }
//       }
//     }
//   });

//   if (orders.length === 0) {
//     return res.status(404).json({ message: 'No orders found' });
//   }

//   const formattedOrders = orders.map((order) => ({
//     id: order.id,
//     status: order.status,
//     products: order.products.map((orderProduct) => orderProduct.product)
//   }));

//   res.json(formattedOrders);
// };
