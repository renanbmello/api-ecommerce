import { Request, Response, NextFunction, RequestHandler } from 'express';
import { prisma } from '../../lib/prisma';
import { ProductParams } from '../../types/product';
import { ApplicationError } from '../../utils/AppError';

export const deleteProduct = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        
        const product = await prisma.product.findUnique({ 
            where: { id },
            include: {
                orders: true,
                carts: true
            }
        });

        if (!product) {
            throw new ApplicationError('Product not found', 404);
        }

        // Verificamos se o produto está em algum pedido ou carrinho
        if (product.orders.length > 0 || product.carts.length > 0) {
            throw new ApplicationError(
                'Cannot delete product because it is referenced in orders or carts',
                400
            );
        }

        await prisma.product.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};