import { PrismaClient } from '@prisma/client';

// Mock do PrismaClient
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        order: {
            findUnique: jest.fn(),
            delete: jest.fn(),
        },
        discount: {
            update: jest.fn(),
        },
        discountUse: {
            deleteMany: jest.fn(),
        },
        orderProduct: {
            deleteMany: jest.fn(),
        },
        $transaction: jest.fn(),
    })),
}));
