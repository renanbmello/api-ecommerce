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

export const clearCart: RequestHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApplicationError('User not authenticated', 401);
        }

        // Usar transação para garantir atomicidade
        const result = await prisma.$transaction(async (tx) => {
            const cart = await tx.cart.findUnique({
                where: { userId }
            });

            if (!cart) {
                throw new ApplicationError('Cart not found', 404);
            }

            // Deletar todos os produtos do carrinho
            await tx.cartProduct.deleteMany({
                where: {
                    cartId: cart.id
                }
            });

            // Retornar o carrinho atualizado
            return await tx.cart.findUnique({
                where: { userId },
                include: {
                    products: true
                }
            });
        });

        res.status(200).json({
            message: 'Cart cleared successfully',
            cart: result
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

export const applyDiscount: RequestHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { discountCode } = req.body;

        if (!userId) {
            throw new ApplicationError('User not authenticated', 401);
        }   

        if (!discountCode) {
            throw new ApplicationError('Discount code is required', 400);
        }

        // Buscar o desconto com validações em uma única query
        const discount = await prisma.discount.findFirst({
            where: { 
                code: discountCode,
                active: true,
                validFrom: {
                    lte: new Date()
                },
                validUntil: {
                    gte: new Date()
                }
            },
            include: {
                usedBy: {
                    where: {
                        userId: userId
                    }
                }
            }
        });

        if (!discount) {
            throw new ApplicationError('Invalid or expired discount code', 400);
        }

        // Verificar se já foi usado pelo usuário
        if (discount.usedBy.length > 0) {
            throw new ApplicationError('Discount code already used by this user', 400);
        }

        // Verificar limite de usos
        if (discount.maxUses && discount.usedCount >= discount.maxUses) {
            throw new ApplicationError('Discount code has reached maximum uses', 400);
        }

        // Buscar carrinho com produtos
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
            throw new ApplicationError('Cart is empty', 400);
        }

        // Calcular subtotal
        const subtotal = cart.products.reduce((acc, curr) => {
            if (!curr.product.price || curr.product.price < 0) {
                throw new ApplicationError('Invalid product price', 400);
            }
            return acc + curr.product.price;
        }, 0);

        // Verificar valor mínimo
        if (discount.minValue && subtotal < discount.minValue) {
            throw new ApplicationError(
                `Cart total must be at least ${discount.minValue} to use this discount`,
                400
            );
        }

        // Calcular desconto
        let discountAmount = 0;
        if (discount.type === 'PERCENTAGE') {
            discountAmount = subtotal * (discount.value / 100);
        } else if (discount.type === 'FIXED_AMOUNT') {
            discountAmount = Math.min(discount.value, subtotal); // Não permite desconto maior que o subtotal
        } else {
            throw new ApplicationError('Invalid discount type', 400);
        }

        const total = Math.max(0, subtotal - discountAmount);

        // Registrar o uso do desconto (opcional - pode ser feito apenas no checkout)
        await prisma.$transaction(async (tx) => {
            // Incrementar contador de uso
            await tx.discount.update({
                where: { id: discount.id },
                data: { usedCount: { increment: 1 } }
            });

            // Registrar uso pelo usuário
            await tx.discountUse.create({
                data: {
                    discount: { connect: { id: discount.id } },
                    user: { connect: { id: userId } },
                    // orderId será preenchido no checkout
                }
            });
        });

        // Formatar valores monetários
        const formatCurrency = (value: number) => 
            Number(value.toFixed(2));

        res.json({
            subtotal: formatCurrency(subtotal),
            discountAmount: formatCurrency(discountAmount),
            total: formatCurrency(total),
            discount: {
                code: discount.code,
                type: discount.type,
                value: discount.value,
                minValue: discount.minValue
            },
            message: 'Discount applied successfully'
        });

    } catch (error) {
        next(error);
    }
};       
