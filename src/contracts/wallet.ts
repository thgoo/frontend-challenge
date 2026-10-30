import { z } from 'zod';
import { idSchema } from './common';
import { FIELD_ERRORS } from './field-errors';

export const networkSchema = z.enum(['ethereum', 'polygon', 'arbitrum', 'base']);
export type Network = z.infer<typeof networkSchema>;

export const walletProviderSchema = z.enum(['metamask', 'coinbase', 'walletconnect']);
export type WalletProvider = z.infer<typeof walletProviderSchema>;

export const walletRoleSchema = z.enum(['primary', 'secondary']);
export type WalletRole = z.infer<typeof walletRoleSchema>;

export const walletInputSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, FIELD_ERRORS.walletLabelRequired)
    .max(40, FIELD_ERRORS.walletLabelTooLong),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, FIELD_ERRORS.walletAddressInvalid),
  provider: walletProviderSchema,
});
export type WalletInput = z.infer<typeof walletInputSchema>;

export const walletSchema = walletInputSchema.extend({
  id: idSchema,
  role: walletRoleSchema,
});
export type Wallet = z.infer<typeof walletSchema>;

export const walletConnectionInputSchema = z.object({ walletId: idSchema, network: networkSchema });
export type WalletConnectionInput = z.infer<typeof walletConnectionInputSchema>;

export const walletConnectionSchema = walletConnectionInputSchema.extend({
  connectedAt: z.iso.datetime(),
});
export type WalletConnection = z.infer<typeof walletConnectionSchema>;
