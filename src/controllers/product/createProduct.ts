import { NextFunction, Request, Response, RequestHandler } from 'express';
import { CreateProductData } from '../../types/product';
import { ApplicationError } from '../../utils/AppError';
import { prisma } from '../../lib/prisma';

export const createProduct: RequestHandler<{}, {}, CreateProductData> = async (
    req: Request<{}, {}, CreateProductData>,
    res: Response,
    next: NextFunction
) => {
    try {
        const productData: CreateProductData = req.body;
        const product = await prisma.product.create({
            data: productData
        });
        if (!product) {
            throw new ApplicationError('Failed to create product', 500);
        }
        res.status(201).json(product);
    } catch (error: unknown) {
        next(error);
    }
};