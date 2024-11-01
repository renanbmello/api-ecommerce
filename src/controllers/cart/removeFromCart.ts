import { RequestHandler, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import { ApplicationError } from '../../utils/AppError';
import { prisma } from '../../lib/prisma';


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