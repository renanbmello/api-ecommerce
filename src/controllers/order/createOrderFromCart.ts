import { Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { ApplicationError } from '../../utils/AppError';
import { OrderStatus } from '../../types/order';
import { AuthenticatedRequest } from '../../types/auth';

interface CreateOrderBody {
    discountId?: string;
}

export const createOrderFromCart = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        const { discountId } = req.body as CreateOrderBody;

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

        if (!cart || cart.products.length === 0) {
            throw new ApplicationError('Cart is empty', 400);
        }

        // Verificar estoque dos produtos
        for (const cartProduct of cart.products) {
            if (cartProduct.product.stock <= 0) {
                throw new ApplicationError(
                    `Product ${cartProduct.product.name} is out of stock`,
                    400
                );
            }
        }

        // Calcular valores
        const subtotal = cart.products.reduce(
            (acc, item) => acc + item.product.price,
            0
        );

        let total = subtotal;
        let discount = null;

        // Aplicar desconto se fornecido
        if (discountId) {
            discount = await prisma.discount.findUnique({
                where: { 
                    id: discountId,
                    active: true,
                    validUntil: { gte: new Date() }
                }
            });

            if (!discount) {
                throw new ApplicationError('Invalid or expired discount', 400);
            }

            // Calcular desconto
            const discountAmount = discount.type === 'PERCENTAGE'
                ? subtotal * (discount.value / 100)
                : discount.value;

            total = Math.max(0, subtotal - discountAmount);
        }

        // Criar pedido usando transação
        const order = await prisma.$transaction(async (tx) => {
            // 1. Criar o pedido
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    status: OrderStatus.PENDING,
                    subtotal,
                    total,
                    discountId,
                    products: {
                        create: cart.products.map(cp => ({
                            productId: cp.productId
                        }))
                    }
                },
                include: {
                    products: {
                        include: {
                            product: true
                        }
                    }
                }
            });

            // 2. Atualizar estoque dos produtos
            for (const cartProduct of cart.products) {
                await tx.product.update({
                    where: { id: cartProduct.productId },
                    data: {
                        stock: {
                            decrement: 1
                        }
                    }
                });
            }

            // 3. Se houver desconto, registrar uso
            if (discount) {
                await tx.discountUse.create({
                    data: {
                        discountId: discount.id,
                        userId,
                        orderId: newOrder.id
                    }
                });

                await tx.discount.update({
                    where: { id: discount.id },
                    data: {
                        usedCount: {
                            increment: 1
                        }
                    }
                });
            }

            // 4. Limpar o carrinho
            await tx.cartProduct.deleteMany({
                where: { cartId: cart.id }
            });

            return newOrder;
        });

        res.status(201).json({
            message: 'Order created successfully',
            order: {
                id: order.id,
                status: order.status,
                subtotal: order.subtotal,
                total: order.total,
                products: order.products.map(op => ({
                    id: op.product.id,
                    name: op.product.name,
                    price: op.product.price
                }))
            }
        });

    } catch (error) {
        next(error);
    }
};


