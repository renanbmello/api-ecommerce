import { Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../types/auth';
import { ApplicationError } from '../../utils/AppError';
import { Prisma } from '@prisma/client';

interface OrderQueryParams {
    status?: string;
    page?: string;
    limit?: string;
}

export const getAllOrders = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        const { status, page = '1', limit = '10' } = req.query as OrderQueryParams;
        
        if (!userId) {
            throw new ApplicationError('User not authenticated', 401);
        }

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        const where = {
            userId,
            ...(status && { status })
        };

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    products: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true
                                }
                            }
                        }
                    },
                    discount: {
                        select: {
                            code: true,
                            type: true,
                            value: true
                        }
                    }
                },
                orderBy: {
                    createdAt: Prisma.SortOrder.desc
                },
                skip,
                take: limitNumber
            }),
            prisma.order.count({ where })
        ]);

        const formattedOrders = orders.map(order => ({
            id: order.id,
            status: order.status,
            subtotal: order.subtotal,
            total: order.total,
            createdAt: order.createdAt,
            products: order.products.map(op => ({
                id: op.product.id,
                name: op.product.name,
                price: op.product.price
            })),
            discount: order.discount ? {
                code: order.discount.code,
                type: order.discount.type,
                value: order.discount.value
            } : null
        }));

        res.status(200).json({
            message: 'Orders retrieved successfully',
            data: {
                orders: formattedOrders,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(total / limitNumber)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};