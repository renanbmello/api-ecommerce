import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Invalid email format')
      .min(5, 'Email must be at least 5 characters')
      .max(100, 'Email must be less than 100 characters'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must be less than 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Invalid email format'),
    password: z.string()
      .min(1, 'Password is required')
  })
});