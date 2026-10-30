import { z } from 'zod';
import { displayNameSchema, passwordSchema, registerInputSchema } from './auth';
import { FIELD_ERRORS } from './field-errors';

export const profileUpdateSchema = registerInputSchema
  .pick({ username: true, email: true })
  .extend({ name: displayNameSchema, bio: z.string().trim().max(280, FIELD_ERRORS.bioTooLong) });
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, FIELD_ERRORS.passwordRequired),
    newPassword: passwordSchema,
  })
  .refine((input) => input.currentPassword !== input.newPassword, {
    path: ['newPassword'],
    message: FIELD_ERRORS.passwordUnchanged,
  });
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
