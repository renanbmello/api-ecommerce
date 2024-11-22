import { Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../types/auth';
import { ApplicationError } from '../../utils/AppError';
import { OrderStatus } from '../../types/order';

export const deleteOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;  
        const userId = req.user?.userId;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                products: true,
                discountUse: true
            }
        });

        if (!order) {
            throw new ApplicationError('Order not found', 404);
        }   

        if (order.userId !== userId) {
            throw new ApplicationError('You are not authorized to delete this order', 403);
        }   

        const deletableStatuses = [OrderStatus.CANCELLED, OrderStatus.PENDING];
        if (!deletableStatuses.includes(order.status as OrderStatus)) {
            throw new ApplicationError(
                'Only cancelled or pending orders can be deleted', 
                400
            );
        }

        await prisma.$transaction(async (tx) => {
            if (order.discountId) {
                await tx.discount.update({
                    where: { id: order.discountId },
                    data: {
                        usedCount: {
                            decrement: 1
                        }
                    }
                });
            }

            await Promise.all([
                tx.discountUse.deleteMany({
                    where: { orderId: id }
                }),
                tx.orderProduct.deleteMany({
                    where: { orderId: id }
                })
            ]);

            await tx.order.delete({
                where: { id }
            });
        });

        res.status(200).json({ 
            message: 'Order deleted successfully',
            orderId: id 
        });
    } catch (error) {
        next(error);
    }
}       