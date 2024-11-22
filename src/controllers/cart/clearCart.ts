import { RequestHandler, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import { ApplicationError } from '../../utils/AppError';
import { prisma } from '../../lib/prisma';


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

        const result = await prisma.$transaction(async (tx) => {
            const cart = await tx.cart.findUnique({
                where: { userId }
            });

            if (!cart) {
                throw new ApplicationError('Cart not found', 404);
            }

            await tx.cartProduct.deleteMany({
                where: {
                    cartId: cart.id
                }
            });

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