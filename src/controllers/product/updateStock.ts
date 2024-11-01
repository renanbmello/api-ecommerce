import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { ProductParams } from '../../types/product';


export const updateStock = async (
    req: Request<{ id: string }, {}, { stock: number }>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { stock }
        });

        res.json(updatedProduct);
    } catch (error) {
        next(error);
    }
};