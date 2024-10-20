import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createProduct = async (req: Request, res: Response) => {
    const { name, description, price, stock } = req.body;
    const product = await prisma.product.create({
        data: { name, description, price, stock }
    });
    res.json(product);
};

export const updateStock = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { stock } = req.body;
    const updatedProduct = await prisma.product.update({
        where: { id },
        data: { stock }
    });
    res.json(updatedProduct);
};
