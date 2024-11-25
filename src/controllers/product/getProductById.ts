import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { ApplicationError } from '../../utils/AppError';
import { ParamsDictionary } from 'express-serve-static-core';

interface ProductRequestParams extends ParamsDictionary {
  productId: string;
}

export const getProductById = async (
    req: Request<ProductRequestParams>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { productId } = req.params;
        
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            throw new ApplicationError('Product not found', 404);
        }

        res.json(product);
    } catch (error) {
        next(error);
    }
};