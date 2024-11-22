import { Request, Response } from 'express';
import { AuthenticatedRequest as BaseAuthenticatedRequest } from '../../types/auth';

export type TestAuthenticatedRequest = BaseAuthenticatedRequest & {
    body: {
        discountId?: string;
    };
    params?: {
        id?: string;
    };
};

export type MockResponse = {
    status: jest.Mock<Response>;
    json: jest.Mock<Response>;
    send: jest.Mock<Response>;
    sendStatus: jest.Mock<Response>;
} & Response;
