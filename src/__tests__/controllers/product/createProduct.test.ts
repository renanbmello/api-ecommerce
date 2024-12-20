import { Request, Response, NextFunction } from 'express';
import { createProduct } from '@/controllers/product/createProduct';
import { prisma } from '@/lib/prisma';
import { MockResponse } from '../../types/test.types';

describe('createProduct Controller', () => {
    let mockReq: Partial<Request>;
    let mockRes: MockResponse;
    let mockNext: jest.Mock;

    beforeEach(() => {
        mockReq = {
            body: {
                name: 'Test Product',
                price: 99.99,
                description: 'Test Description'
            }
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn(),
            sendStatus: jest.fn()
        } as MockResponse;

        mockNext = jest.fn();
    });

    it('should create a product successfully', async () => {
        const mockProduct = {
            id: '1',
            ...mockReq.body
        };

        (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

        await createProduct(
            mockReq as Request,
            mockRes as Response,
            mockNext
        );

        expect(prisma.product.create).toHaveBeenCalledWith({
            data: mockReq.body
        });
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
            message: 'Product created successfully',
            product: mockProduct
        });
    });

    it('should handle errors when product creation fails', async () => {
        (prisma.product.create as jest.Mock).mockResolvedValue(null);

        await createProduct(
            mockReq as Request,
            mockRes as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalled();
        const error = mockNext.mock.calls[0][0];
        expect(error.message).toBe('Failed to create product');
        expect(error.statusCode).toBe(500);
    });

    it('should pass any caught error to next middleware', async () => {
        const testError = new Error('Test error');
        (prisma.product.create as jest.Mock).mockRejectedValue(testError);

        await createProduct(
            mockReq as Request,
            mockRes as Response,
            mockNext
        );

        expect(mockNext).toHaveBeenCalledWith(testError);
    });
}); 