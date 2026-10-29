import { z } from 'zod';
import { cartLineSchema } from './cart';
import { ethAmountSchema, idSchema, timestampSchema } from './common';
import { priceSummarySchema } from './pricing';
import { networkSchema } from './wallet';

export const quoteRequestSchema = z.object({ network: networkSchema });
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export const quoteLineSchema = cartLineSchema
  .omit({ available: true, maxPerOrder: true })
  .extend({ lineTotalEth: ethAmountSchema });
export type QuoteLine = z.infer<typeof quoteLineSchema>;

/** A priced snapshot of the cart that an order must reference to be accepted. */
export const quoteSchema = priceSummarySchema.extend({
  id: idSchema,
  lines: z.array(quoteLineSchema).min(1),
  expiresAt: timestampSchema,
});
export type Quote = z.infer<typeof quoteSchema>;
