import { NextFunction, Request, Response } from 'express';
import { CreateProductInput } from '../../schemas/productSchema';
import { ApplicationError } from '../../utils/AppError';
import { prisma } from '../../lib/prisma';

export const createProduct = async (
    req: Request<{}, {}, CreateProductInput>,
    res: Response,
    next: NextFunction
) => {
    try {
        const productData = req.body;
        
        const product = await prisma.product.create({
            data: productData
        });

        if (!product) {
            throw new ApplicationError('Failed to create product', 500);
        }

        res.status(201).json({
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        next(error);
    }
};