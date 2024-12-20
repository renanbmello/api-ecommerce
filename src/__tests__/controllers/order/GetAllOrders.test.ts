import { prisma } from '../../../lib/prisma';
import { getAllOrders } from '../../../controllers/order/GetAllOrders';
import { createMockResponse } from '../../helpers/mockHelpers';
import { OrderStatus } from '../../../types/order';

jest.mock('../../../lib/prisma', () => ({
    prisma: {
        order: {
            findMany: jest.fn(),
            count: jest.fn()
        }
    }
}));

describe('getAllOrders', () => {
    const mockReq: any = {
        user: { userId: 'test-user-id' },
        query: {}
    };
    const mockRes = createMockResponse();
    const mockNext = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all orders successfully', async () => {
        // Arrange
        const mockOrders = [{
            id: '1',
            status: OrderStatus.PENDING,
            subtotal: 100,
            total: 90,
            createdAt: new Date(),
            products: [{
                product: {
                    id: 'prod1',
                    name: 'Test Product',
                    price: 100
                }
            }],
            discount: {
                code: 'TEST10',
                type: 'percentage',
                value: 10
            }
        }];
        
        (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
        (prisma.order.count as jest.Mock).mockResolvedValue(1);

        // Act
        await getAllOrders(mockReq, mockRes, mockNext);

        // Assert
        expect(prisma.order.findMany).toHaveBeenCalledWith({
            where: { userId: 'test-user-id' },
            include: {
                products: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true
                            }
                        }
                    }
                },
                discount: {
                    select: {
                        code: true,
                        type: true,
                        value: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: 0,
            take: 10
        });
        
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Orders retrieved successfully',
            data: {
                orders: expect.arrayContaining([
                    expect.objectContaining({
                        id: '1',
                        status: OrderStatus.PENDING,
                        products: expect.any(Array),
                        discount: expect.any(Object)
                    })
                ]),
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1
                }
            }
        });
    });

    it('should handle empty orders list', async () => {
        // Arrange
        (prisma.order.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.order.count as jest.Mock).mockResolvedValue(0);

        // Act
        await getAllOrders(mockReq, mockRes, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Orders retrieved successfully',
            data: {
                orders: [],
                pagination: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0
                }
            }
        });
    });

    it('should handle database error', async () => {
        // Arrange
        (prisma.order.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));
        (prisma.order.count as jest.Mock).mockRejectedValue(new Error('Database error'));

        // Act
        await getAllOrders(mockReq, mockRes, mockNext);

        // Assert
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockRes.status).not.toHaveBeenCalled();
        expect(mockRes.json).not.toHaveBeenCalled();
    });
}); 