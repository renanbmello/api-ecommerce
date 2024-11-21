import { z } from 'zod';

export const createProductSchema = z.object({
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

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;