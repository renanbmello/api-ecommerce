import { createMockResponse } from '../../helpers/mockHelpers';
import { TestAuthenticatedRequest, MockResponse } from '../../types/test.types';
import { clearCart } from '../../../controllers/cart/clearCart';
import { prisma } from '../../../lib/prisma';
import { NextFunction } from 'express';
import { ApplicationError } from '../../../utils/AppError';

// Mock do prisma
jest.mock('../../../lib/prisma', () => {
    const mockPrisma = {
        cart: {
            findUnique: jest.fn(),
        },
        cartProduct: {
            deleteMany: jest.fn(),
        },
    };

    return {
        prisma: {
            ...mockPrisma,
            $transaction: jest.fn((callback) => callback(mockPrisma)),
        },
    };
});

describe('clearCart', () => {
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

    it('should clear cart successfully', async () => {
        // Arrange
        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [
                {
                    id: 'product-1',
                    name: 'Product 1',
                },
            ],
        };

        const mockEmptyCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [],
        };

        (prisma.cart.findUnique as jest.Mock)
            .mockResolvedValueOnce(mockCart)
            .mockResolvedValueOnce(mockEmptyCart);
        (prisma.cartProduct.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

        // Act
        await clearCart(mockReq, mockRes, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Cart cleared successfully',
            cart: mockEmptyCart,
        });
    });

    it('should throw error when user is not authenticated', async () => {
        // Arrange
        mockReq.user = undefined;

        // Act
        await clearCart(mockReq, mockRes, mockNext);

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
        await clearCart(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Cart not found');
        expect(error.status).toBe(404);
    });

    it('should handle database error during transaction', async () => {
        // Arrange
        const dbError = new Error('Database error');
        (prisma.$transaction as jest.Mock).mockRejectedValue(dbError);

        // Act
        await clearCart(mockReq, mockRes, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it('should handle database error during deleteMany', async () => {
        // Arrange
        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [],
        };

        const deleteError = new Error('Delete error');
        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
        (prisma.cartProduct.deleteMany as jest.Mock).mockRejectedValue(deleteError);
        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
            return callback(prisma);
        });

        // Act
        await clearCart(mockReq, mockRes, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(deleteError);
    });

    it('should clear empty cart successfully', async () => {
        // Arrange
        const mockEmptyCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [],
        };

        (prisma.cart.findUnique as jest.Mock)
            .mockResolvedValueOnce(mockEmptyCart)
            .mockResolvedValueOnce(mockEmptyCart);
        (prisma.cartProduct.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

        // Act
        await clearCart(mockReq, mockRes, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Cart cleared successfully',
            cart: mockEmptyCart,
        });
    });
});