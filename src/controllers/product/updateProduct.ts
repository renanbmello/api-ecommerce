import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { UpdateProductData, ProductParams } from '../../types/product';
import { ApplicationError } from '../../utils/AppError';

export const updateProduct = async (
    req: Request<{ id: string }, {}, UpdateProductData>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData: UpdateProductData = req.body;

        const existingProduct = await prisma.product.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            throw new ApplicationError('Product not found', 404);
        }

        validateProductUpdate(updateData);

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: updateData
        });

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        next(error);
    }
};

const validateProductUpdate = (updateData: UpdateProductData): void => {
    if (updateData.price !== undefined && updateData.price < 0) {
        throw new ApplicationError('Price cannot be negative', 400);
    }

    if (updateData.stock !== undefined && updateData.stock < 0) {
        throw new ApplicationError('Stock cannot be negative', 400);
    }

    if (updateData.name !== undefined && updateData.name.trim().length < 3) {
        throw new ApplicationError('Product name must be at least 3 characters long', 400);
    }
};