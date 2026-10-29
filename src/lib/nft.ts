import type { Edition, Nft } from '@/contracts/nft';
import { parseEth } from './eth';

export function lowestPrice(nft: Nft): bigint {
  return nft.editions.reduce(
    (lowest, edition) => {
      const price = parseEth(edition.priceEth);
      return price < lowest ? price : lowest;
    },
    parseEth(nft.editions[0]?.priceEth ?? '0'),
  );
}

export function isAvailable(nft: Nft): boolean {
  return nft.editions.some((edition) => edition.available > 0);
}

export function purchasableQuantity(edition: Edition): number {
  return Math.min(edition.available, edition.maxPerOrder);
}
