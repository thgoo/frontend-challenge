import { z } from 'zod';
import { idSchema, timestampSchema } from './common';
import { quoteSchema } from './quote';
import { networkSchema } from './wallet';
import { FIELD_ERRORS } from './field-errors';

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'declined']);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const TERMINAL_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set(['confirmed', 'declined']);

export const buyerSchema = z.object({
  fullName: z.string().trim().min(2, FIELD_ERRORS.fullNameRequired),
  email: z.email(FIELD_ERRORS.emailInvalid),
  note: z.string().trim().max(280, FIELD_ERRORS.noteTooLong).optional(),
});
export type Buyer = z.infer<typeof buyerSchema>;

export const IDEMPOTENCY_HEADER = 'Idempotency-Key';

/** Sent with the idempotency header; the same key with a different body yields 409. */
export const createOrderInputSchema = z.object({
  quoteId: idSchema,
  walletId: idSchema,
  network: networkSchema,
  buyer: buyerSchema,
});
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

/** The receipt is the immutable quote snapshot taken when the order was created. */
export const orderSchema = z.object({
  id: idSchema,
  status: orderStatusSchema,
  receipt: quoteSchema.omit({ id: true, expiresAt: true }),
  buyer: buyerSchema,
  walletAddress: z.string(),
  txHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  failureReason: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  version: z.number().int().nonnegative(),
});
export type Order = z.infer<typeof orderSchema>;
