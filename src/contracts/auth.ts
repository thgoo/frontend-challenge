import { z } from 'zod';
import { idSchema, timestampSchema } from './common';
import { FIELD_ERRORS } from './field-errors';

export const passwordSchema = z
  .string()
  .min(8, FIELD_ERRORS.passwordTooShort)
  .max(72, FIELD_ERRORS.passwordTooLong)
  .regex(/[A-Za-z]/, FIELD_ERRORS.passwordNeedsLetter)
  .regex(/\d/, FIELD_ERRORS.passwordNeedsNumber);

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
  email: z.email(FIELD_ERRORS.emailInvalid),
  password: z.string().min(1, FIELD_ERRORS.passwordRequired),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const registerInputSchema = z.object({
  name: z.string().trim().min(2, FIELD_ERRORS.nameRequired),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{3,20}$/, FIELD_ERRORS.usernameInvalid),
  email: z.email(FIELD_ERRORS.emailInvalid),
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerInputSchema>;
