import { Request, Response } from 'express';
import { AuthenticatedRequest as BaseAuthenticatedRequest } from '../../types/auth';

// Extendendo a interface AuthenticatedRequest existente
export type TestAuthenticatedRequest = BaseAuthenticatedRequest & {
    body: {
        discountId?: string;
    };
    params?: {
        id?: string;
    };
};

// Interface para o response mockado
export type MockResponse = {
    status: jest.Mock<Response>;
    json: jest.Mock<Response>;
    send: jest.Mock<Response>;
    sendStatus: jest.Mock<Response>;
} & Response;
