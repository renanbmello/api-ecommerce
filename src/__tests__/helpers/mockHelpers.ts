import { Response } from 'express';
import { MockResponse } from '../types/test.types';

export const createMockResponse = (): MockResponse => {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        sendStatus: jest.fn().mockReturnThis(),
        headersSent: false,
        locals: {},
    } as MockResponse;

    return res;
};
