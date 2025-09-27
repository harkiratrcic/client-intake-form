import { z } from 'zod';

export const CreateFormInstanceSchema = z.object({
  templateId: z.string().min(1, 'templateId is required'),
  clientEmail: z
    .string()
    .email('Invalid email format')
    .min(1, 'clientEmail is required'),
  personalMessage: z
    .string()
    .max(1000, 'personalMessage must be less than 1000 characters')
    .optional(),
  expiryDays: z
    .number()
    .min(0.5, 'expiryDays must be at least 0.5 days (12 hours)')
    .max(30, 'expiryDays cannot exceed 30 days')
    .optional(),
});

export type CreateFormInstanceInput = z.infer<typeof CreateFormInstanceSchema>;