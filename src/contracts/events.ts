import { z } from 'zod';
import { ethAmountSchema, idSchema, timestampSchema } from './common';
import { orderSchema } from './order';

function eventSchema<TType extends string, TData extends z.ZodType>(
  type: TType,
  resourceType: string,
  data: TData,
) {
  return z.object({
    eventId: idSchema,
    type: z.literal(type),
    resource: z.object({ type: z.literal(resourceType), id: idSchema }),
    /** Resource version after the change; clients drop events with version <= the known one. */
    version: z.number().int().nonnegative(),
    occurredAt: timestampSchema,
    data,
  });
}

export const nftUpdatedEventSchema = eventSchema(
  'nft.updated',
  'nft',
  z.object({
    editions: z.array(
      z.object({
        id: idSchema,
        priceEth: ethAmountSchema,
        available: z.number().int().nonnegative(),
      }),
    ),
  }),
);
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>;

export const orderUpdatedEventSchema = eventSchema(
  'order.updated',
  'order',
  orderSchema.pick({ status: true, txHash: true, explorerUrl: true, failureReason: true }),
);
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>;

/** Not the default `/socket.io`: MSW rewrites that path, which would also capture Vite's HMR socket. */
export const SOCKET_PATH = '/realtime';

export const SOCKET_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
} as const;
