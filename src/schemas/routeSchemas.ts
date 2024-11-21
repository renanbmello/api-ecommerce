import { z } from 'zod';
import { createProductSchema, updateProductSchema } from './productSchema';

export const createProductRouteSchema = z.object({
    body: createProductSchema
});

export const updateProductRouteSchema = z.object({
    body: updateProductSchema,
    params: z.object({
        id: z.string().uuid()
    })
});