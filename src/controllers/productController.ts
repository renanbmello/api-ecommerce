import { NextFunction, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createProduct = async (req: Request, res: Response) => {
    const { name, description, price, stock } = req.body;
    const product = await prisma.product.create({
        data: { name, description, price, stock }
    });
    res.json(product);
};

export const updateStock: RequestHandler = async (req, res, next) => {
    const { id } = req.params; // ID do produto a ser atualizado
    const { stock } = req.body; // Nova quantidade de estoque

    try {
        // Verifica se o produto existe
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }

        // Atualiza o estoque do produto
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { stock }
        });

        res.json(updatedProduct);
    } catch (error: unknown) {
        const errorMessage = (error as Error).message;
        res.status(400).json({ error: 'Failed to update stock', details: errorMessage });
    }
};

export const updateProduct: RequestHandler = async (req, res, next) => {
    const { id } = req.params;
    const { name, description, price, stock } = req.body;

    try {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { name, description, price, stock }
        });

        res.json(updatedProduct);
    } catch (error: unknown) {
        const errorMessage = (error as Error).message;
        res.status(400).json({ error: 'Failed to update product', details: errorMessage });
    }
};


export const getAllProducts: RequestHandler = async (req, res, next) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error: unknown) {
        const errorMessage = (error as Error).message;
        res.status(500).json({ error: 'Failed to fetch products', details: errorMessage });
    }
};

export const getProductById: RequestHandler = async (req, res, next) => {
    const { id } = req.params;

    try {
        const product = await prisma.product.findUnique({ where: { id } });
        
        if (!product) {
            res.status(404).json({ message: 'Product not found' });
            return;
        }

        res.json(product);
    } catch (error: unknown) {
        const errorMessage = (error as Error).message;
        res.status(500).json({ error: 'Failed to fetch product', details: errorMessage });
    }
};

export const deleteProduct: RequestHandler = async (req, res, next) => {
    const { id } = req.params;

    try {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
             res.status(404).json({ message: 'Product not found' });
             return;
        }

        await prisma.product.delete({ where: { id } });
        res.status(204).send(); 
    } catch (error: unknown) {
        const errorMessage = (error as Error).message;
        res.status(500).json({ error: 'Failed to delete product', details: errorMessage });
    }
};