import { Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../types/auth';
import { ApplicationError } from '../../utils/AppError';

export const getOrderById = async (req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            throw new ApplicationError('User not authenticated', 401);
        }

        const order = await prisma.order.findUnique({
            where: { id},
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
                discount: true
            },
        });

        if (!order) {
            throw new ApplicationError('Order not found', 404);
        }
        
        if (order.userId !== userId) {
            throw new ApplicationError('You are not authorized to access this order', 403);
        }

        res.status(200).json({
            message: 'Order retrieved successfully',
            order:{
                id: order.id,
                status: order.status,
                subtotal: order.subtotal,
                total: order.total,
                products: order.products.map((op) => ({
                    id: op.product.id,
                    name: op.product.name,
                    price: op.product.price,
                })),
                discount: order.discount ? {
                    code: order.discount.code,
                    value: order.discount.value,
                    type: order.discount.type,
                } : null,
            },
        });

    } catch (error) {
        next(error);
    }   
};