import { Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../types/auth';
import { ApplicationError } from '../../utils/AppError';
import { OrderStatus } from '../../types/order';

export const updateOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user?.userId;

        if (status && !Object.values(OrderStatus).includes(status)) {
            throw new ApplicationError('Invalid order status', 400);
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                products: {
                    include: {
                        product: true
                    }
                },
                discount: true
            }
        });

        if (!order) {
            throw new ApplicationError('Order not found', 404);
        }

        if (order.userId !== userId) {
            throw new ApplicationError('You are not authorized to update this order', 403);
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                status,
            },
            include: {
                products: {
                    include: {
                        product: true
                    }
                },
                discount: true
            }
        });

        res.status(200).json(updatedOrder);
    } catch (error) {
        next(error);
    }
}       