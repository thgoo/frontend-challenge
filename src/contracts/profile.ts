import { z } from 'zod';
import { passwordSchema, registerInputSchema } from './auth';

export const profileUpdateSchema = registerInputSchema
  .pick({ name: true, username: true, email: true })
  .extend({ bio: z.string().trim().max(280, 'Use at most 280 characters') });
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
  })
  .refine((input) => input.currentPassword !== input.newPassword, {
    path: ['newPassword'],
    message: 'Choose a different password',
  });
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
