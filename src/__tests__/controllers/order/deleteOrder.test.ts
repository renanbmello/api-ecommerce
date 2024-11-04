import { deleteOrder } from '../../../controllers/order/deleteOrder';
import { prisma } from '../../../lib/prisma';
import { OrderStatus } from '../../../types/order';
import { ApplicationError } from '../../../utils/AppError';

// Mock do prisma
jest.mock('../../../lib/prisma', () => ({
    prisma: {
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
        $transaction: jest.fn((callback) => callback(prisma)),
    },
}));

const expectError = (error: any, message: string, status: number) => {
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
};

describe('deleteOrder', () => {
    // Setup para cada teste
    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
        mockReq = {
            params: { id: 'test-order-id' },
            user: { userId: 'test-user-id' },
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockNext = jest.fn();
    });

    // Limpar mocks após cada teste
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully delete an order', async () => {
        // Arrange
        const mockOrder = {
            id: 'test-order-id',
            userId: 'test-user-id',
            status: OrderStatus.PENDING,
            discountId: null,
            products: [],
            discountUse: [],
        };

        (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
        (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
            await callback(prisma);
        });

        // Act
        await deleteOrder(mockReq, mockRes, mockNext);

        // Assert
        expect(prisma.order.findUnique).toHaveBeenCalledWith({
            where: { id: 'test-order-id' },
            include: {
                products: true,
                discountUse: true,
            },
        });
        expect(prisma.order.delete).toHaveBeenCalledWith({
            where: { id: 'test-order-id' },
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Order deleted successfully',
            orderId: 'test-order-id',
        });
    });

    it('should throw error when order not found', async () => {
        // Arrange
        (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

        // Act
        await deleteOrder(mockReq, mockRes, mockNext);

        // Assert
        expectError(mockNext.mock.calls[0][0], 'Order not found', 404);
    });

    it('should throw error when user is not authorized', async () => {
        // Arrange
        const mockOrder = {
            id: 'test-order-id',
            userId: 'different-user-id',
            status: OrderStatus.PENDING,
        };
        (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

        // Act
        await deleteOrder(mockReq, mockRes, mockNext);

        // Assert
        expectError(mockNext.mock.calls[0][0], 'You are not authorized to delete this order', 403);
    });

    it('should throw error when order status is not deletable', async () => {
        // Arrange
        const mockOrder = {
            id: 'test-order-id',
            userId: 'test-user-id',
            status: OrderStatus.COMPLETED,
        };
        (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

        // Act
        await deleteOrder(mockReq, mockRes, mockNext);

        // Assert
        expectError(mockNext.mock.calls[0][0], 'Only cancelled or pending orders can be deleted', 400);
    });

    it('should decrement discount usage when order has discount', async () => {
        // Arrange
        const mockOrder = {
            id: 'test-order-id',
            userId: 'test-user-id',
            status: OrderStatus.PENDING,
            discountId: 'test-discount-id',
            products: [],
            discountUse: [],
        };
        (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

        // Act
        await deleteOrder(mockReq, mockRes, mockNext);

        // Assert
        expect(prisma.discount.update).toHaveBeenCalledWith({
            where: { id: 'test-discount-id' },
            data: {
                usedCount: {
                    decrement: 1,
                },
            },
        });
    });
});
