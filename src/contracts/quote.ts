import { z } from 'zod';
import { cartItemKeySchema } from './cart';
import { ethAmountSchema, idSchema, quantitySchema, timestampSchema } from './common';
import { networkSchema } from './wallet';

export const quoteRequestSchema = z.object({
  network: networkSchema,
  couponCode: z.string().trim().min(1).optional(),
});
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export const quoteLineSchema = cartItemKeySchema.extend({
  nftName: z.string(),
  editionName: z.string(),
  imageUrl: z.string(),
  quantity: quantitySchema,
  unitPriceEth: ethAmountSchema,
  lineTotalEth: ethAmountSchema,
});
export type QuoteLine = z.infer<typeof quoteLineSchema>;

export const couponSchema = z.object({
  code: z.string(),
  basisPoints: z.number().int().min(1).max(10_000),
});
export type Coupon = z.infer<typeof couponSchema>;

export const quoteSchema = z.object({
  id: idSchema,
  network: networkSchema,
  lines: z.array(quoteLineSchema).min(1),
  coupon: couponSchema.nullable(),
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  expiresAt: timestampSchema,
});
export type Quote = z.infer<typeof quoteSchema>;
