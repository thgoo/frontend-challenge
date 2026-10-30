import type { Edition, Nft } from '@/contracts/nft';
import { parseEth } from './eth';

/** Contracts guarantee at least one edition. */
export function cheapestEdition(nft: Nft): Edition {
  return nft.editions.reduce((cheapest, edition) =>
    parseEth(edition.priceEth) < parseEth(cheapest.priceEth) ? edition : cheapest,
  );
}

export function lowestPrice(nft: Nft): bigint {
  return parseEth(cheapestEdition(nft).priceEth);
}

export function isAvailable(nft: Nft): boolean {
  return nft.editions.some((edition) => edition.available > 0);
}

export function purchasableQuantity(edition: Edition): number {
  return Math.min(edition.available, edition.maxPerOrder);
}
