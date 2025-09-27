import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .transform(email => email.toLowerCase().trim()),
  password: z.string()
    .min(1, 'Password is required')
    .max(255, 'Password is too long'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const sessionTokenSchema = z.object({
  token: z.string().min(1, 'Session token is required'),
});

export type SessionTokenInput = z.infer<typeof sessionTokenSchema>;