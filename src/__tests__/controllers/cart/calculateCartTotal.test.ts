import { createMockResponse } from '../../helpers/mockHelpers';
import { TestAuthenticatedRequest, MockResponse } from '../../types/test.types';
import { calculateCartTotal } from '../../../controllers/cart/calculateCartTotal';
import { prisma } from '../../../lib/prisma';
import { NextFunction } from 'express';
import { ApplicationError } from '../../../utils/AppError';

// Mock do prisma
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        cart: {
            findUnique: jest.fn(),
        },
    },
}));

describe('calculateCartTotal', () => {
    let mockReq: TestAuthenticatedRequest;
    let mockRes: MockResponse;
    let mockNext: jest.Mock<NextFunction>;

    beforeEach(() => {
        mockReq = {
            user: { userId: 'test-user-id' },
        } as TestAuthenticatedRequest;
        mockRes = createMockResponse();
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should calculate cart total successfully', async () => {
        // Arrange
        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [
                {
                    product: {
                        id: 'product-1',
                        name: 'Product 1',
                        price: 100.50,
                    },
                },
                {
                    product: {
                        id: 'product-2',
                        name: 'Product 2',
                        price: 50.75,
                    },
                },
            ],
        };

        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

        // Act
        await calculateCartTotal(mockReq, mockRes, mockNext);

        // Assert
        expect(prisma.cart.findUnique).toHaveBeenCalledWith({
            where: { userId: 'test-user-id' },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        expect(mockRes.json).toHaveBeenCalledWith({
            total: 151.25,
            itemCount: 2,
            items: [
                {
                    productId: 'product-1',
                    name: 'Product 1',
                    price: 100.50,
                },
                {
                    productId: 'product-2',
                    name: 'Product 2',
                    price: 50.75,
                },
            ],
            currency: 'BRL',
        });
    });

    it('should handle empty cart', async () => {
        // Arrange
        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [],
        };

        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

        // Act
        await calculateCartTotal(mockReq, mockRes, mockNext);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
            total: 0,
            itemCount: 0,
            items: [],
        });
    });

    it('should throw error when user is not authenticated', async () => {
        // Arrange
        mockReq.user = undefined;

        // Act
        await calculateCartTotal(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('User not authenticated');
        expect(error.status).toBe(401);
    });

    it('should throw error when cart is not found', async () => {
        // Arrange
        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null);

        // Act
        await calculateCartTotal(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Cart not found');
        expect(error.status).toBe(404);
    });

    it('should throw error when product has invalid price', async () => {
        // Arrange
        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [
                {
                    product: {
                        id: 'product-1',
                        name: 'Product 1',
                        price: -10, // Preço inválido
                    },
                },
            ],
        };

        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

        // Act
        await calculateCartTotal(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Invalid product price');
        expect(error.status).toBe(400);
    });

    it('should round total to 2 decimal places', async () => {
        // Arrange
        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [
                {
                    product: {
                        id: 'product-1',
                        name: 'Product 1',
                        price: 10.999, // Preço com 3 casas decimais
                    },
                },
            ],
        };

        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

        // Act
        await calculateCartTotal(mockReq, mockRes, mockNext);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
            total: 11.00,
            itemCount: 1,
            items: [
                {
                    productId: 'product-1',
                    name: 'Product 1',
                    price: 10.999,
                },
            ],
            currency: 'BRL',
        });
    });
});