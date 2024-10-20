import { Request, Response } from 'express';
import { PrismaClient, Product } from '@prisma/client';

const prisma = new PrismaClient();

export const addToCart = async (req: Request, res: Response) => {
  const { userId } = req.body; // Assumindo que o usuário já está autenticado e o ID está disponível
  const { productId } = req.body;

  // Verificar se o produto existe
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Verificar se o usuário já tem um carrinho
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId }
    });
  }

  // Adicionar produto ao carrinho
  await prisma.cartProduct.create({
    data: {
      cartId: cart.id,
      productId: product.id
    }
  });

  res.json({ message: 'Product added to cart' });
};

export const removeFromCart = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const { productId } = req.body;

  // Encontrar o carrinho do usuário
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  // Remover o produto do carrinho
  await prisma.cartProduct.deleteMany({
    where: { cartId: cart.id, productId }
  });

  res.json({ message: 'Product removed from cart' });
};

export const getCartProducts = async (req: Request, res: Response) => {
  const { userId } = req.body;

  // Encontrar o carrinho do usuário
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      products: {
        include: {
          product: true
        }
      }
    }
  });

  if (!cart || cart.products.length === 0) {
    return res.status(404).json({ message: 'Cart is empty' });
  }

  const cartItems = cart.products.map((cartProduct: { product: Product }) => cartProduct.product);

  res.json(cartItems);
};
