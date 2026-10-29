import type { CartItemKey } from '@/contracts/cart';
import type { Edition, Nft } from '@/contracts/nft';
import type { DbState } from '../db/types';
import { nftUpdatedEvent } from './events';
import type { Tx } from './tx';

export interface EditionRef {
  nft: Nft;
  edition: Edition;
}

export function findEdition(db: DbState, key: CartItemKey): EditionRef | undefined {
  const nft = db.nfts.find((candidate) => candidate.id === key.nftId);
  const edition = nft?.editions.find((candidate) => candidate.id === key.editionId);
  return nft && edition ? { nft, edition } : undefined;
}

export function purchasableQuantity(edition: Edition): number {
  return Math.min(edition.available, edition.maxPerOrder);
}

/** Single write path for catalog changes, so every change bumps the version and emits `nft.updated`. */
export function updateEdition(
  tx: Tx,
  key: CartItemKey,
  patch: Partial<Pick<Edition, 'priceEth' | 'available'>>,
): EditionRef | undefined {
  const ref = findEdition(tx.db, key);
  if (!ref) return undefined;
  Object.assign(ref.edition, patch);
  ref.nft.version += 1;
  tx.emit(nftUpdatedEvent(tx.db, ref.nft, tx.now));
  return ref;
}

export function adjustAvailability(tx: Tx, key: CartItemKey, delta: number) {
  const ref = findEdition(tx.db, key);
  if (ref) updateEdition(tx, key, { available: Math.max(0, ref.edition.available + delta) });
}
