import { createMockResponse } from '../../helpers/mockHelpers';
import { TestAuthenticatedRequest, MockResponse } from '../../types/test.types';
import { getOrderById } from '../../../controllers/order/GetOrderById';
import { prisma } from '../../../lib/prisma';
import { OrderStatus } from '../../../types/order';
import { NextFunction } from 'express';
import { ApplicationError } from '../../../utils/AppError';

// Mock do prisma
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        order: {
            findUnique: jest.fn(),
        },
    },
}));

describe('getOrderById', () => {
    let mockReq: TestAuthenticatedRequest;
    let mockRes: MockResponse;
    let mockNext: jest.Mock<NextFunction>;

    beforeEach(() => {
        mockReq = {
            user: { userId: 'test-user-id' },
            params: { id: 'test-order-id' },
        } as TestAuthenticatedRequest;
        mockRes = createMockResponse();
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return order successfully', async () => {
        // Arrange
        const mockOrder = {
            id: 'test-order-id',
            userId: 'test-user-id',
            status: OrderStatus.PENDING,
            subtotal: 100,
            total: 90,
            products: [
                {
                    product: {
                        id: 'product-1',
                        name: 'Test Product',
                        price: 100,
                    },
                },
            ],
            discount: {
                code: 'TEST10',
                value: 10,
                type: 'PERCENTAGE',
            },
        };

        (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

        // Act
        await getOrderById(mockReq, mockRes, mockNext);

        // Assert
        expect(prisma.order.findUnique).toHaveBeenCalledWith({
            where: { id: 'test-order-id' },
            include: {
                products: {
                    include: {
                        product: true,
                    },
                },
                discount: true,
            },
        });

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Order retrieved successfully',
            order: {
                id: mockOrder.id,
                status: mockOrder.status,
                subtotal: mockOrder.subtotal,
                total: mockOrder.total,
                products: [{
                    id: 'product-1',
                    name: 'Test Product',
                    price: 100,
                }],
                discount: {
                    code: 'TEST10',
                    value: 10,
                    type: 'PERCENTAGE',
                },
            },
        });
    });

    it('should return order without discount', async () => {
        // Arrange
        const mockOrder = {
            id: 'test-order-id',
            userId: 'test-user-id',
            status: OrderStatus.PENDING,
            subtotal: 100,
            total: 100,
            products: [
                {
                    product: {
                        id: 'product-1',
                        name: 'Test Product',
                        price: 100,
                    },
                },
            ],
            discount: null,
        };

        (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

        // Act
        await getOrderById(mockReq, mockRes, mockNext);

        // Assert
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Order retrieved successfully',
            order: {
                id: mockOrder.id,
                status: mockOrder.status,
                subtotal: mockOrder.subtotal,
                total: mockOrder.total,
                products: [{
                    id: 'product-1',
                    name: 'Test Product',
                    price: 100,
                }],
                discount: null,
            },
        });
    });

    it('should throw error when user is not authenticated', async () => {
        // Arrange
        mockReq.user = undefined;

        // Act
        await getOrderById(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('User not authenticated');
        expect(error.status).toBe(401);
    });

    it('should throw error when order is not found', async () => {
        // Arrange
        (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

        // Act
        await getOrderById(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Order not found');
        expect(error.status).toBe(404);
    });

    it('should throw error when user is not authorized to access order', async () => {
        // Arrange
        const mockOrder = {
            id: 'test-order-id',
            userId: 'different-user-id', // Different user
            status: OrderStatus.PENDING,
            subtotal: 100,
            total: 100,
            products: [],
            discount: null,
        };

        (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

        // Act
        await getOrderById(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('You are not authorized to access this order');
        expect(error.status).toBe(403);
    });

    it('should handle database error', async () => {
        // Arrange
        const dbError = new Error('Database error');
        (prisma.order.findUnique as jest.Mock).mockRejectedValue(dbError);

        // Act
        await getOrderById(mockReq, mockRes, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(dbError);
    });
}); 