import { RequestHandler, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import { ApplicationError } from '../../utils/AppError';
import { prisma } from '../../lib/prisma';



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
