import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Interface base para erros
export interface BaseError extends Error {
  code?: string;
  status?: number;
  meta?: Record<string, any>;
}

// Códigos de erro do Prisma
export type PrismaErrorCode = 
    | 'P2002' // Unique constraint violation
    | 'P2003' // Foreign key constraint violation
    | 'P2025' // Record not found
    | string; // outros códigos

// Interface específica para erros do Prisma
export interface PrismaError extends PrismaClientKnownRequestError {
  code: PrismaErrorCode;
  meta?: {
    target?: string[];
    cause?: string;
    modelName?: string;
    field_name?: string;
  };
}

// Interface para erros da aplicação
export interface AppError extends BaseError {
  status: number;
  message: string;
}
