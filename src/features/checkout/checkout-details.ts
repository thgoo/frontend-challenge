import { z } from 'zod';
import { FIELD_ERRORS } from '@/contracts/field-errors';
import { buyerSchema } from '@/contracts/order';
import { networkSchema } from '@/contracts/wallet';
import { readStored, removeStored, writeStored } from '@/lib/session-storage';

export const checkoutDetailsSchema = buyerSchema.extend({
  walletId: z.string().min(1, FIELD_ERRORS.walletRequired),
  network: networkSchema,
});
export type CheckoutDetails = z.infer<typeof checkoutDetailsSchema>;

const DRAFT_KEY = 'checkout:draft';

/** Keeps typed details across reloads and re-authentication so the buyer never starts over. */
export const checkoutDraft = {
  read: () => readStored(DRAFT_KEY, checkoutDetailsSchema.partial()),
  write: (draft: Partial<CheckoutDetails>) => {
    writeStored(DRAFT_KEY, draft);
  },
  clear: () => {
    removeStored(DRAFT_KEY);
  },
};
