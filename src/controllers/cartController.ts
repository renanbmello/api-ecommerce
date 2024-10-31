import { Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { AddToCartData, CartProduct } from '../types/cart';
import { ApplicationError } from '../utils/AppError';
import { AuthenticatedRequest } from '../types/auth';

const prisma = new PrismaClient();

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

export const getCart: RequestHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApplicationError('User not authenticated', 401);
        }

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

        if (!cart) {
            throw new ApplicationError('Cart not found', 404);
        }

        res.json(cart);
    } catch (error) {
        next(error);
    }
};

export const removeFromCart: RequestHandler = async (  
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        const { productId } = req.params;

        if (!userId) {
            throw new ApplicationError('User not authenticated', 401);
        }

        if (!productId) {
            throw new ApplicationError('Product ID is required', 400);
        }

        // Buscar o carrinho do usuário
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

        if (!cart) {
            throw new ApplicationError('Cart not found', 404);
        }

        // Verificar se o produto está no carrinho
        const existingProduct = cart.products.find(p => p.productId === productId);
        if (!existingProduct) {
            throw new ApplicationError('Product not found in cart', 404);
        }

        // Remover o produto do carrinho
        const removedProduct = await prisma.cartProduct.delete({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: productId
                }
            }
        });

        res.status(200).json({
            message: 'Product removed from cart successfully',
            removedProduct
        });
    } catch (error) {
        next(error);
    }
};   

export const calculateCartTotal: RequestHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApplicationError('User not authenticated', 401);
        }

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

        if (!cart) {
            throw new ApplicationError('Cart not found', 404);
        }   

        if (cart.products.length === 0) {
            res.json({
                total: 0,
                itemCount: 0,
                items: []
            });
            return;
        }

        const cartItems = cart.products.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
        }));

        const total = cart.products.reduce((acc, curr) => {
            if (typeof curr.product.price !== 'number' || curr.product.price < 0) {
                throw new ApplicationError('Invalid product price', 400);
            }
            return acc + curr.product.price;
        }, 0);

        const roundedTotal = Number(total.toFixed(2));

        res.json({
            total: roundedTotal,
            itemCount: cart.products.length,
            items: cartItems,
            currency: 'BRL'
        });
    } catch (error) {
        next(error);
    }
};      
