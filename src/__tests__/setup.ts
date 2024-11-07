import { prisma } from "@/lib/prisma";

jest.mock('@/lib/prisma', () => ({
    prisma: jest.fn().mockImplementation(() => ({
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
