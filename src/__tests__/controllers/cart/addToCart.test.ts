import { createMockResponse } from '../../helpers/mockHelpers';
import { TestAuthenticatedRequest, MockResponse } from '../../types/test.types';
import { addToCart } from '../../../controllers/cart/addToCart';
import { prisma } from '../../../lib/prisma';
import { NextFunction } from 'express';
import { ApplicationError } from '../../../utils/AppError';

// Mock do prisma
jest.mock('../../../lib/prisma', () => ({
    prisma: {
        product: {
            findUnique: jest.fn(),
        },
        cart: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        cartProduct: {
            create: jest.fn(),
        },
    },
}));

describe('addToCart', () => {
    let mockReq: TestAuthenticatedRequest;
    let mockRes: MockResponse;
    let mockNext: jest.Mock<NextFunction>;

    beforeEach(() => {
        mockReq = {
            user: { userId: 'test-user-id' },
            body: { productId: 'test-product-id' },
        } as TestAuthenticatedRequest;
        mockRes = createMockResponse();
        mockNext = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should add product to cart successfully with existing cart', async () => {
        // Arrange
        const mockProduct = {
            id: 'test-product-id',
            name: 'Test Product',
            price: 100,
            stock: 10,
        };

        const mockCart = {
            id: 'test-cart-id',
            userId: 'test-user-id',
            products: [],
        };

        const mockCartProduct = {
            id: 'test-cart-product-id',
            cartId: 'test-cart-id',
            productId: 'test-product-id',
            product: mockProduct,
        };

        (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
        (prisma.cartProduct.create as jest.Mock).mockResolvedValue(mockCartProduct);

        // Act
        await addToCart(mockReq, mockRes, mockNext);

        // Assert
        expect(prisma.product.findUnique).toHaveBeenCalledWith({
            where: { id: 'test-product-id' },
        });
        expect(prisma.cartProduct.create).toHaveBeenCalledWith({
            data: {
                cart: { connect: { id: mockCart.id } },
                product: { connect: { id: mockProduct.id } },
            },
            include: { product: true },
        });
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith(mockCartProduct);
    });

    it('should create new cart and add product when cart does not exist', async () => {
        // Arrange
        const mockProduct = {
            id: 'test-product-id',
            name: 'Test Product',
            price: 100,
            stock: 10,
        };

        const mockNewCart = {
            id: 'new-cart-id',
            userId: 'test-user-id',
            products: [],
        };

        (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.cart.create as jest.Mock).mockResolvedValue(mockNewCart);

        // Act
        await addToCart(mockReq, mockRes, mockNext);

        // Assert
        expect(prisma.cart.create).toHaveBeenCalledWith({
            data: {
                user: { connect: { id: 'test-user-id' } },
            },
            include: { products: true },
        });
    });

    it('should throw error when user is not authenticated', async () => {
        // Arrange
        mockReq.user = undefined;

        // Act
        await addToCart(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('User not authenticated');
        expect(error.status).toBe(401);
    });

    it('should throw error when productId is not provided', async () => {
        // Arrange
        mockReq.body = {};

        // Act
        await addToCart(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Product ID is required');
        expect(error.status).toBe(400);
    });

    it('should throw error when product is not found', async () => {
        // Arrange
        (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

        // Act
        await addToCart(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Product not found');
        expect(error.status).toBe(404);
    });

    it('should throw error when product is out of stock', async () => {
        // Arrange
        const mockProduct = {
            id: 'test-product-id',
            name: 'Test Product',
            price: 100,
            stock: 0,
        };

        (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

        // Act
        await addToCart(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Product out of stock');
        expect(error.status).toBe(400);
    });

    it('should throw error when product is already in cart', async () => {
        // Arrange
        const mockProduct = {
            id: 'test-product-id',
            name: 'Test Product',
            price: 100,
            stock: 10,
        };

        const mockCart = {
            id: 'test-cart-id',
            userId: 'test-user-id',
            products: [{ productId: 'test-product-id' }],
        };

        (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
        (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);

        // Act
        await addToCart(mockReq, mockRes, mockNext);

        // Assert
        const error = mockNext.mock.calls[0][0];
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error.message).toBe('Product already in cart');
        expect(error.status).toBe(400);
    });
});