import { RequestHandler, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../types/auth';
import { ApplicationError } from '../../utils/AppError';
import { prisma } from '../../lib/prisma';



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