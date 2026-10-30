import { z } from 'zod';
import { ethAmountSchema } from './common';
import { networkSchema } from './wallet';
import { FIELD_ERRORS } from './field-errors';

export const couponSchema = z.object({
  code: z.string(),
  basisPoints: z.number().int().min(1).max(10_000),
});
export type Coupon = z.infer<typeof couponSchema>;

export const couponInputSchema = z.object({
  code: z.string().trim().min(1, FIELD_ERRORS.couponRequired).toUpperCase(),
});
export type CouponInput = z.infer<typeof couponInputSchema>;

export const priceSummarySchema = z.object({
  network: networkSchema,
  coupon: couponSchema.nullable(),
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
});
export type PriceSummary = z.infer<typeof priceSummarySchema>;
