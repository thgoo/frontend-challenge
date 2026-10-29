import { z } from 'zod';
import { ethAmountSchema, idSchema, quantitySchema } from './common';

export const cartItemKeySchema = z.object({ nftId: idSchema, editionId: idSchema });
export type CartItemKey = z.infer<typeof cartItemKeySchema>;

export const cartItemInputSchema = cartItemKeySchema.extend({ quantity: quantitySchema });
export type CartItemInput = z.infer<typeof cartItemInputSchema>;

export const cartLineSchema = cartItemInputSchema.extend({
  nftName: z.string(),
  editionName: z.string(),
  imageUrl: z.string(),
  unitPriceEth: ethAmountSchema,
  available: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
});
export type CartLine = z.infer<typeof cartLineSchema>;

/** Works for guests (cookie-bound cart) and users; the guest cart merges into the user's on login. */
export const cartSchema = z.object({
  lines: z.array(cartLineSchema),
  version: z.number().int().nonnegative(),
});
export type Cart = z.infer<typeof cartSchema>;
