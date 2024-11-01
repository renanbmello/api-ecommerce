import { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createDiscount: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const discount = await prisma.discount.create({
            data: {
                code: req.body.code,
                type: req.body.type,
                value: req.body.value,
                minValue: req.body.minValue,
                maxUses: req.body.maxUses,
                validFrom: new Date(req.body.validFrom),
                validUntil: new Date(req.body.validUntil),
                active: true
            }
        });

        res.status(201).json(discount);
    } catch (error) {
        next(error);
    }
};
