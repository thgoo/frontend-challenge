import { z } from 'zod';
import { idSchema, timestampSchema } from './common';

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const userSchema = z.object({
  id: idSchema,
  name: z.string(),
  username: z.string(),
  email: z.email(),
  bio: z.string(),
  avatarUrl: z.string().nullable(),
});
export type User = z.infer<typeof userSchema>;

export const sessionSchema = z.object({
  user: userSchema,
  expiresAt: timestampSchema,
});
export type Session = z.infer<typeof sessionSchema>;

export const loginInputSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const registerInputSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name'),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{3,20}$/, 'Use 3-20 lowercase letters, numbers or underscores'),
  email: z.email('Enter a valid email'),
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerInputSchema>;
