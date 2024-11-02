import { Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../types/auth';
import { ApplicationError } from '../../utils/AppError';
import { OrderStatus } from '../../types/order';

export const deleteOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;  
        const userId = req.user?.userId;

        // Verificar se o pedido existe com suas relações
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

        // Verificar se o pedido pode ser deletado baseado no status
        const deletableStatuses = [OrderStatus.CANCELLED, OrderStatus.PENDING];
        if (!deletableStatuses.includes(order.status as OrderStatus)) {
            throw new ApplicationError(
                'Only cancelled or pending orders can be deleted', 
                400
            );
        }

        // Deletar o pedido e suas relações em uma transação
        await prisma.$transaction(async (tx) => {
            // Se houver desconto aplicado, decrementar o contador de uso
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

            // Deletar registros relacionados
            await Promise.all([
                tx.discountUse.deleteMany({
                    where: { orderId: id }
                }),
                tx.orderProduct.deleteMany({
                    where: { orderId: id }
                })
            ]);

            // Por fim, deletar o pedido
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