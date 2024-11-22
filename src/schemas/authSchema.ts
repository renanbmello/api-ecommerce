import { z } from 'zod';
import type { UserRegistrationData, UserLoginData } from '../types/user';

export const registerSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Invalid email format')
      .min(5, 'Email must be at least 5 characters'),
    password: z.string()
      .min(6, 'Password must be at least 6 characters'),
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
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

export type ZodRegisterInput = z.infer<typeof registerSchema>['body'];
export type ZodLoginInput = z.infer<typeof loginSchema>['body'];

type VerifyTypes = {
  register: ZodRegisterInput extends UserRegistrationData ? true : false;
  login: ZodLoginInput extends UserLoginData ? true : false;
};