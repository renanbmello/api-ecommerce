import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { BaseError, PrismaError, AppError } from '../types/error';

export const errorHandler: ErrorRequestHandler = (
    error: BaseError | PrismaClientKnownRequestError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(error);

    if (error instanceof PrismaClientKnownRequestError) {
        const prismaError = error as PrismaError;
        
        switch (prismaError.code) {
            case 'P2002':
                return void res.status(400).json({
                    message: 'Unique constraint violation',
                    details: prismaError.meta?.target,
                    field: prismaError.meta?.target?.[0]
                });

            case 'P2003':
                return void res.status(400).json({
                    message: 'Foreign key constraint violation',
                    details: `Cannot delete ${prismaError.meta?.modelName} because it is referenced by other records`,
                    model: prismaError.meta?.modelName
                });

            case 'P2025':
                return void res.status(404).json({
                    message: 'Record not found',
                    details: prismaError.meta?.cause
                });

            default:
                return void res.status(400).json({
                    message: 'Database error',
                    code: prismaError.code
                });
        }
    }

    if ((error as AppError).status) {
        const appError = error as AppError;
        return void res.status(appError.status).json({
            message: appError.message
        });
    }

    return void res.status(500).json({
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
            details: error.message,
            stack: error.stack
        })
    });
};
