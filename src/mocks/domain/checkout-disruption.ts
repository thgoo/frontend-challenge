import { formatEth, parseEth } from '@/lib/eth';
import type { Scenario } from '../scenarios';
import { updateEdition } from './inventory';
import type { Tx } from './tx';

const PRICE_INCREASE_PERCENT = 10n;

export function applyCheckoutDisruption(
  tx: Tx,
  kind: Scenario['checkoutDisruption'],
  quoteId: string,
) {
  if (kind === 'none' || tx.db.checkoutDisruptionApplied) return;
  const line = tx.db.quotes.find((quote) => quote.id === quoteId)?.lines[0];
  if (!line) return;

  tx.db.checkoutDisruptionApplied = true;
  if (kind === 'price-change') {
    const increased = (parseEth(line.unitPriceEth) * (100n + PRICE_INCREASE_PERCENT)) / 100n;
    updateEdition(tx, line, { priceEth: formatEth(increased) });
  } else {
    updateEdition(tx, line, { available: 0 });
  }
}
