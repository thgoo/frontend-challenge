import type { Cart } from '@/contracts/cart';
import type { Quote } from '@/contracts/quote';

/** A quote is stale once the live cart no longer matches it, e.g. after an `nft.updated` event. */
export function isQuoteStale(quote: Quote, cart: Cart | undefined): boolean {
  if (!cart) return false;
  if (cart.lines.length !== quote.lines.length) return true;
  return quote.lines.some((quoted) => {
    const current = cart.lines.find(
      (line) => line.nftId === quoted.nftId && line.editionId === quoted.editionId,
    );
    return (
      !current ||
      current.quantity !== quoted.quantity ||
      current.unitPriceEth !== quoted.unitPriceEth ||
      current.available < quoted.quantity
    );
  });
}
