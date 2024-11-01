import { RequestHandler, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import { ApplicationError } from '../../utils/AppError';
import { prisma } from '../../lib/prisma';

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