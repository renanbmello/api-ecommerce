import { createMockResponse } from '../../helpers/mockHelpers';
import { TestAuthenticatedRequest, MockResponse } from '../../types/test.types';
import { applyDiscount } from '../../../controllers/cart/applyDiscount';
import { prisma } from '../../../lib/prisma';
import { NextFunction } from 'express';
import { ApplicationError } from '../../../utils/AppError';

// Mock do prisma
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        discount: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        cart: {
            findUnique: jest.fn(),
        },
        discountUse: {
            create: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(prisma)),
    },
}));

describe('applyDiscount', () => {
    let mockReq: TestAuthenticatedRequest;
    let mockRes: MockResponse;
    let mockNext: jest.Mock<NextFunction>;
    const currentDate = new Date();

    beforeEach(() => {
        mockReq = {
            user: { userId: 'test-user-id' },
            body: { discountCode: 'TEST10' },
        } as TestAuthenticatedRequest;
        mockRes = createMockResponse();
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should apply percentage discount successfully', async () => {
        // Arrange
        const mockDiscount = {
            id: 'discount-id',
            code: 'TEST10',
            type: 'PERCENTAGE',
            value: 10,
            active: true,
            validFrom: new Date(currentDate.getTime() - 86400000), // yesterday
            validUntil: new Date(currentDate.getTime() + 86400000), // tomorrow
            usedCount: 0,
            maxUses: 100,
            minValue: 50,
            usedBy: [],
        };

        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [
                {
                    product: {
                        id: 'product-1',
                        price: 100,
                    },
                },
            ],
        };

        (prisma.discount.findFirst as jest.Mock).mockResolvedValue(mockDiscount);
        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

        // Act
        await applyDiscount(mockReq, mockRes, mockNext);

        // Assert
        expect(prisma.discount.findFirst).toHaveBeenCalledWith({
            where: {
                code: 'TEST10',
                active: true,
                validFrom: { lte: expect.any(Date) },
                validUntil: { gte: expect.any(Date) },
            },
            include: {
                usedBy: {
                    where: { userId: 'test-user-id' },
                },
            },
        });

        expect(mockRes.json).toHaveBeenCalledWith({
            subtotal: 100,
            discountAmount: 10,
            total: 90,
            discount: {
                code: 'TEST10',
                type: 'PERCENTAGE',
                value: 10,
                minValue: 50,
            },
            message: 'Discount applied successfully',
        });
    });

    it('should apply fixed amount discount successfully', async () => {
        // Arrange
        const mockDiscount = {
            id: 'discount-id',
            code: 'FIXED20',
            type: 'FIXED_AMOUNT',
            value: 20,
            active: true,
            validFrom: new Date(currentDate.getTime() - 86400000),
            validUntil: new Date(currentDate.getTime() + 86400000),
            usedCount: 0,
            maxUses: 100,
            minValue: 50,
            usedBy: [],
        };

        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [
                {
                    product: {
                        id: 'product-1',
                        price: 100,
                    },
                },
            ],
        };

        (prisma.discount.findFirst as jest.Mock).mockResolvedValue(mockDiscount);
        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

        // Act
        await applyDiscount(mockReq, mockRes, mockNext);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
            subtotal: 100,
            discountAmount: 20,
            total: 80,
            discount: expect.any(Object),
            message: 'Discount applied successfully',
        });
    });

    it('should throw error when user is not authenticated', async () => {
        // Arrange
        mockReq.user = undefined;

        // Act
        await applyDiscount(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('User not authenticated');
        expect(error.status).toBe(401);
    });

    it('should throw error when discount code is not provided', async () => {
        // Arrange
        mockReq.body = {};

        // Act
        await applyDiscount(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Discount code is required');
        expect(error.status).toBe(400);
    });

    it('should throw error when discount is invalid or expired', async () => {
        // Arrange
        (prisma.discount.findFirst as jest.Mock).mockResolvedValue(null);

        // Act
        await applyDiscount(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Invalid or expired discount code');
        expect(error.status).toBe(400);
    });

    it('should throw error when discount is already used by user', async () => {
        // Arrange
        const mockDiscount = {
            id: 'discount-id',
            code: 'TEST10',
            type: 'PERCENTAGE',
            value: 10,
            active: true,
            validFrom: new Date(currentDate.getTime() - 86400000),
            validUntil: new Date(currentDate.getTime() + 86400000),
            usedCount: 0,
            maxUses: 100,
            usedBy: [{ userId: 'test-user-id' }],
        };

        (prisma.discount.findFirst as jest.Mock).mockResolvedValue(mockDiscount);

        // Act
        await applyDiscount(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Discount code already used by this user');
        expect(error.status).toBe(400);
    });

    it('should throw error when discount reached maximum uses', async () => {
        // Arrange
        const mockDiscount = {
            id: 'discount-id',
            code: 'TEST10',
            type: 'PERCENTAGE',
            value: 10,
            active: true,
            validFrom: new Date(currentDate.getTime() - 86400000),
            validUntil: new Date(currentDate.getTime() + 86400000),
            usedCount: 100,
            maxUses: 100,
            usedBy: [],
        };

        (prisma.discount.findFirst as jest.Mock).mockResolvedValue(mockDiscount);

        // Act
        await applyDiscount(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Discount code has reached maximum uses');
        expect(error.status).toBe(400);
    });

    it('should throw error when cart is empty', async () => {
        // Arrange
        const mockDiscount = {
            id: 'discount-id',
            code: 'TEST10',
            type: 'PERCENTAGE',
            value: 10,
            active: true,
            validFrom: new Date(currentDate.getTime() - 86400000),
            validUntil: new Date(currentDate.getTime() + 86400000),
            usedCount: 0,
            maxUses: 100,
            usedBy: [],
        };

        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [],
        };

        (prisma.discount.findFirst as jest.Mock).mockResolvedValue(mockDiscount);
        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

        // Act
        await applyDiscount(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Cart is empty');
        expect(error.status).toBe(400);
    });

    it('should throw error when cart total is below minimum value', async () => {
        // Arrange
        const mockDiscount = {
            id: 'discount-id',
            code: 'TEST10',
            type: 'PERCENTAGE',
            value: 10,
            active: true,
            validFrom: new Date(currentDate.getTime() - 86400000),
            validUntil: new Date(currentDate.getTime() + 86400000),
            usedCount: 0,
            maxUses: 100,
            minValue: 200,
            usedBy: [],
        };

        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [
                {
                    product: {
                        id: 'product-1',
                        price: 100,
                    },
                },
            ],
        };

        (prisma.discount.findFirst as jest.Mock).mockResolvedValue(mockDiscount);
        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

        // Act
        await applyDiscount(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Cart total must be at least 200 to use this discount');
        expect(error.status).toBe(400);
    });
});