import { Request, Response, NextFunction, RequestHandler } from 'express';
import { prisma } from '../../lib/prisma';
import { ProductParams } from '../../types/product';
import { ApplicationError } from '../../utils/AppError';

export const getProductById: RequestHandler<ProductParams> = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({ where: { id } });
        
        if (!product) {
            throw new ApplicationError('Product not found', 404);
        }

        res.json(product);
    } catch (error) {
        next(error);
    }
};