import { z } from 'zod';
import { ethAmountSchema, idSchema, quantitySchema } from './common';
import { nftImageSchema } from './nft';
import { priceSummarySchema } from './pricing';

export const cartItemKeySchema = z.object({ nftId: idSchema, editionId: idSchema });
export type CartItemKey = z.infer<typeof cartItemKeySchema>;

export const cartItemInputSchema = cartItemKeySchema.extend({ quantity: quantitySchema });
export type CartItemInput = z.infer<typeof cartItemInputSchema>;

export const cartQuantityInputSchema = cartItemInputSchema.pick({ quantity: true });

export const cartLineSchema = cartItemInputSchema.extend({
  nftName: z.string(),
  tokenId: z.string(),
  editionName: z.string(),
  image: nftImageSchema,
  unitPriceEth: ethAmountSchema,
  available: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
});
export type CartLine = z.infer<typeof cartLineSchema>;

/** Guests get a cookie-bound cart that the server merges into the user's cart on login. */
export const cartSchema = z.object({
  lines: z.array(cartLineSchema),
  summary: priceSummarySchema,
  version: z.number().int().nonnegative(),
});
export type Cart = z.infer<typeof cartSchema>;
