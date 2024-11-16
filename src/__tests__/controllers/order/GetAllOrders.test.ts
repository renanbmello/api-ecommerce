import { createMockResponse } from '../../helpers/mockHelpers';
import { TestAuthenticatedRequest, MockResponse } from '../../types/test.types';
import { getAllOrders } from '../../../controllers/order/GetAllOrders';
import { prisma } from '../../../lib/prisma';
import { OrderStatus } from '../../../types/order';
import { NextFunction } from 'express';
import { ApplicationError } from '../../../utils/AppError';

// Mock do prisma
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        order: {
            findMany: jest.fn(),
        },
    },
}));

describe('getAllOrders', () => {
    let mockReq: TestAuthenticatedRequest;
    let mockRes: MockResponse;
    let mockNext: jest.Mock<NextFunction>;

    beforeEach(() => {
        mockReq = {
            user: { userId: 'test-user-id' },
            query: {}, // Adicionar query para possíveis filtros
        } as TestAuthenticatedRequest;
        mockRes = createMockResponse();
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return all orders successfully', async () => {
        // Arrange
        const mockOrders = [
            {
                id: 'order-1',
                userId: 'test-user-id',
                status: OrderStatus.PENDING,
                subtotal: 100,
                total: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
                products: [], // Incluir relacionamentos relevantes
                discountUse: [],
            },
        ];
        (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

        // Act
        await getAllOrders(mockReq, mockRes, mockNext);

        // Assert
        expect(prisma.order.findMany).toHaveBeenCalledWith({
            where: { userId: 'test-user-id' },
            include: expect.any(Object), // Verificar includes se houver
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            orders: mockOrders,
        });
    });

    it('should handle empty orders list', async () => {
        // Arrange
        (prisma.order.findMany as jest.Mock).mockResolvedValue([]);

        // Act
        await getAllOrders(mockReq, mockRes, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            orders: [],
        });
    });

    it('should handle database error', async () => {
        // Arrange
        const error = new Error('Database error');
        (prisma.order.findMany as jest.Mock).mockRejectedValue(error);

        // Act
        await getAllOrders(mockReq, mockRes, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(expect.any(ApplicationError));
    });
}); 