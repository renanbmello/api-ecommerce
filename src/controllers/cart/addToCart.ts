import { Response, NextFunction, RequestHandler } from 'express';
// import { AddToCartData, CartProduct } from '../types/cart';
import { ApplicationError } from '../../utils/AppError';
import { AuthenticatedRequest } from '../../types/auth';
import { prisma } from '../../lib/prisma';


export const addToCart: RequestHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        const { productId } = req.body;

        if (!userId) {
            throw new ApplicationError('User not authenticated', 401);
        }

        if (!productId) {
            throw new ApplicationError('Product ID is required', 400);
        }

        // Verificar se o produto existe
        const product = await prisma.product.findUnique({ 
            where: { id: productId } 
        });

        if (!product) {
            throw new ApplicationError('Product not found', 404);
        }

        // Verificar se o produto tem estoque
        if (product.stock <= 0) {
            throw new ApplicationError('Product out of stock', 400);
        }

        // Buscar ou criar carrinho
        let cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                products: true
            }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    user: {
                        connect: { id: userId }
                    }
                },
                include: {
                    products: true
                }
            });
        }

        // Verificar se o produto já está no carrinho
        const existingProduct = cart.products.find(p => p.productId === productId);
        if (existingProduct) {
            throw new ApplicationError('Product already in cart', 400);
        }

        // Adicionar produto ao carrinho
        const cartProduct = await prisma.cartProduct.create({
            data: {
                cart: {
                    connect: { id: cart.id }
                },
                product: {
                    connect: { id: productId }
                }
            },
            include: {
                product: true
            }
        });

        res.status(201).json(cartProduct);
    } catch (error) {
        next(error);
    }
};