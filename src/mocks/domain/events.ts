import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/events';
import type { Nft } from '@/contracts/nft';
import type { Order } from '@/contracts/order';
import type { DbState } from '../db/types';
import { nextId } from './ids';

export function nftUpdatedEvent(db: DbState, nft: Nft, now: number): NftUpdatedEvent {
  return {
    eventId: nextId(db, 'evt'),
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    occurredAt: new Date(now).toISOString(),
    data: {
      editions: nft.editions.map(({ id, priceEth, available }) => ({ id, priceEth, available })),
    },
  };
}

export function orderUpdatedEvent(db: DbState, order: Order, now: number): OrderUpdatedEvent {
  return {
    eventId: nextId(db, 'evt'),
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date(now).toISOString(),
    data: {
      status: order.status,
      txHash: order.txHash,
      explorerUrl: order.explorerUrl,
      failureReason: order.failureReason,
    },
  };
}
