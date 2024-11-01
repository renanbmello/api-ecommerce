import { Request, Response, NextFunction } from "express";
import { RequestHandler } from 'express';
import { prisma } from '../../lib/prisma';
import { ApplicationError } from "../../utils/AppError";

export const getAllProducts: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);

        if (!products) {
            throw new ApplicationError('Failed to get products', 500);
        }
    } catch (error: unknown) {
        next(error);
    }
};