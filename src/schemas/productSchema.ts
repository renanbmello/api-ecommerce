import { z } from 'zod';

export const productBaseSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  price: z.number()
    .positive('Price must be positive')
    .min(0.01, 'Minimum price is 0.01'),
  stock: z.number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
}); 

export const createProductSchema = z.object({
  body: productBaseSchema,
});

export const updateProductSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID'),
  }),
  body: productBaseSchema.partial()
});

export const getProductSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID')
  })
});

export const listProductsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val) : 10)),
    search: z.string().optional()
  }),
});

export const updateStockSchema = z.object({
  params: z.object({
    productId: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative')
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductInput = z.infer<typeof getProductSchema>;
export type ListProductsInput = z.infer<typeof listProductsSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;

export type ProductParams = z.infer<typeof getProductSchema>['params'];