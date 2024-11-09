import { TestAuthenticatedRequest, MockResponse } from '../../types/test.types';
import { createOrderFromCart } from '../../../controllers/order/createOrderFromCart';
import { prisma } from '../../../lib/prisma';
import { OrderStatus } from '../../../types/order';
import { ApplicationError } from '../../../utils/AppError';
import { NextFunction } from 'express';
import { createMockResponse } from '../../helpers/mockHelpers';

// Mock do prisma
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        cart: {
            findUnique: jest.fn(),
        },
        discount: {
            findUnique: jest.fn(),
        },
        order: {
            create: jest.fn(),
        },
        product: {
            update: jest.fn(),
        },
        discountUse: {
            create: jest.fn(),
        },
        cartProduct: {
            deleteMany: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(prisma)),
    },
}));

describe('createOrderFromCart', () => {
    let mockReq: TestAuthenticatedRequest;
    let mockRes: MockResponse;
    let mockNext: jest.Mock<NextFunction>;

    beforeEach(() => {
        mockReq = {
            user: { userId: 'test-user-id' },
            body: {},
        } as TestAuthenticatedRequest;
        
        mockRes = createMockResponse();
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create order successfully without discount', async () => {
        // Arrange
        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [
                {
                    productId: 'product-1',
                    product: {
                        id: 'product-1',
                        name: 'Test Product',
                        price: 100,
                        stock: 5
                    }
                }
            ]
        };

        const mockOrder = {
            id: 'order-id',
            status: OrderStatus.PENDING,
            subtotal: 100,
            total: 100,
            products: [
                {
                    product: {
                        id: 'product-1',
                        name: 'Test Product',
                        price: 100
                    }
                }
            ]
        };

        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
        (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);

        // Act
        await createOrderFromCart(mockReq, mockRes, mockNext);

        // Assert
        expect(prisma.cart.findUnique).toHaveBeenCalled();
        expect(prisma.order.create).toHaveBeenCalled();
        expect(prisma.cartProduct.deleteMany).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Order created successfully',
            order: expect.any(Object)
        });
    });

    it('should create order with discount successfully', async () => {
        // Arrange
        mockReq.body.discountId = 'discount-id';
        
        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [
                {
                    productId: 'product-1',
                    product: {
                        id: 'product-1',
                        name: 'Test Product',
                        price: 100,
                        stock: 5
                    }
                }
            ]
        };

        const mockDiscount = {
            id: 'discount-id',
            type: 'PERCENTAGE',
            value: 10,
            active: true,
            validUntil: new Date('2025-12-31')
        };

        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
        (prisma.discount.findUnique as jest.Mock).mockResolvedValue(mockDiscount);

        // Act
        await createOrderFromCart(mockReq, mockRes, mockNext);

        // Assert
        expect(prisma.discount.findUnique).toHaveBeenCalled();
        expect(prisma.discountUse.create).toHaveBeenCalled();
    });

    it('should throw error when cart is empty', async () => {
        // Arrange
        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: []
        };

        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

        // Act
        await createOrderFromCart(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Cart is empty');
        expect(error.status).toBe(400);
    });

    it('should throw error when product is out of stock', async () => {
        // Arrange
        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [
                {
                    productId: 'product-1',
                    product: {
                        id: 'product-1',
                        name: 'Test Product',
                        price: 100,
                        stock: 0
                    }
                }
            ]
        };

        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

        // Act
        await createOrderFromCart(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Product Test Product is out of stock');
        expect(error.status).toBe(400);
    });

    it('should throw error when discount is invalid', async () => {
        // Arrange
        mockReq.body.discountId = 'invalid-discount';
        
        const mockCart = {
            id: 'cart-id',
            userId: 'test-user-id',
            products: [
                {
                    productId: 'product-1',
                    product: {
                        id: 'product-1',
                        name: 'Test Product',
                        price: 100,
                        stock: 5
                    }
                }
            ]
        };

        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
        (prisma.discount.findUnique as jest.Mock).mockResolvedValue(null);

        // Act
        await createOrderFromCart(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Invalid or expired discount');
        expect(error.status).toBe(400);
    });
});