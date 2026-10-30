import { z } from 'zod';
import { FIELD_ERRORS } from './field-errors';

export const newsletterInputSchema = z.object({ email: z.email(FIELD_ERRORS.emailInvalid) });
export type NewsletterInput = z.infer<typeof newsletterInputSchema>;
