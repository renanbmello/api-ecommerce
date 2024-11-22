import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export interface BaseError extends Error {
  code?: string;
  status?: number;
  meta?: Record<string, any>;
}

export type PrismaErrorCode = 
    | 'P2002' 
    | 'P2003' 
    | 'P2025' 
    | string; 

export interface PrismaError extends PrismaClientKnownRequestError {
  code: PrismaErrorCode;
  meta?: {
    target?: string[];
    cause?: string;
    modelName?: string;
    field_name?: string;
  };
}

export interface AppError extends BaseError {
  status: number;
  message: string;
}
