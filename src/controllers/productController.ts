import { NextFunction, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import { Product, CreateProductData, UpdateProductData } from '../types/product';
import { ApplicationError } from '../utils/AppError';

const prisma = new PrismaClient();

// Tipagem específica para o request
interface ProductParams {
  id: string;
}

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
        res.status(201).json(product);
    } catch (error: unknown) {
        next(error);
    }
};

export const updateStock: RequestHandler<ProductParams, {}, { stock: number }> = async (
    req,
    res,
    next
) => {
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

export const updateProduct: RequestHandler<ProductParams, {}, UpdateProductData> = async (
    req,
    res,
    next
) => {
    try {
        const { id } = req.params;
        const updateData: UpdateProductData = req.body;

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: updateData
        });

        res.json(updatedProduct);
    } catch (error) {
        next(error);
    }
};

export const getAllProducts: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error: unknown) {
        next(error);
    }
};

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

export const deleteProduct: RequestHandler<ProductParams> = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        
        // Primeiro verificamos se o produto existe
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