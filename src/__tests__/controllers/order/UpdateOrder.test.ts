import { createMockResponse } from '../../helpers/mockHelpers';
import { TestAuthenticatedRequest, MockResponse } from '../../types/test.types';
import { updateOrder } from '../../../controllers/order/UpdateOrder';
import { prisma } from '../../../lib/prisma';
import { OrderStatus } from '../../../types/order';
import { NextFunction } from 'express';
import { ApplicationError } from '../../../utils/AppError';

// Mock do prisma
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        order: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

describe('updateOrder', () => {
    let mockReq: TestAuthenticatedRequest;
    let mockRes: MockResponse;
    let mockNext: jest.Mock<NextFunction>;

    beforeEach(() => {
        mockReq = {
            user: { userId: 'test-user-id' },
            params: { id: 'test-order-id' },
            body: { status: OrderStatus.COMPLETED },
        } as TestAuthenticatedRequest;
        mockRes = createMockResponse();
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should update order status successfully', async () => {
        // Arrange
        const mockOrder = {
            id: 'test-order-id',
            userId: 'test-user-id',
            status: OrderStatus.PENDING,
            products: [
                {
                    product: {
                        id: 'product-1',
                        name: 'Test Product',
                    },
                },
            ],
            discount: null,
        };

        const mockUpdatedOrder = {
            ...mockOrder,
            status: OrderStatus.COMPLETED,
        };

        (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
        (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

        // Act
        await updateOrder(mockReq, mockRes, mockNext);

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

        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'test-order-id' },
            data: { status: OrderStatus.COMPLETED },
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
        expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedOrder);
    });

    it('should throw error when status is invalid', async () => {
        // Arrange
        mockReq.body.status = 'INVALID_STATUS';

        // Act
        await updateOrder(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Invalid order status');
        expect(error.status).toBe(400);
    });

    it('should throw error when order is not found', async () => {
        // Arrange
        (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

        // Act
        await updateOrder(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Order not found');
        expect(error.status).toBe(404);
    });

    it('should throw error when user is not authorized', async () => {
        // Arrange
        const mockOrder = {
            id: 'test-order-id',
            userId: 'different-user-id',
            status: OrderStatus.PENDING,
            products: [],
            discount: null,
        };

        (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

        // Act
        await updateOrder(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('You are not authorized to update this order');
        expect(error.status).toBe(403);
    });

    it('should handle database error', async () => {
        // Arrange
        const dbError = new Error('Database error');
        (prisma.order.findUnique as jest.Mock).mockRejectedValue(dbError);

        // Act
        await updateOrder(mockReq, mockRes, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it('should handle database error during update', async () => {
        // Arrange
        const mockOrder = {
            id: 'test-order-id',
            userId: 'test-user-id',
            status: OrderStatus.PENDING,
            products: [],
            discount: null,
        };

        const dbError = new Error('Update failed');
        (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
        (prisma.order.update as jest.Mock).mockRejectedValue(dbError);

        // Act
        await updateOrder(mockReq, mockRes, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(dbError);
    });
});