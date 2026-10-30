import { describe, expect, it } from 'vitest';
import type { Cart } from '@/contracts/cart';
import type { Quote } from '@/contracts/quote';
import { isQuoteStale } from './quote-freshness';

const line = {
  nftId: 'n1',
  editionId: 'e1',
  nftName: 'A',
  tokenId: '#0001',
  editionName: 'S',
  image: { url: '', alt: '', variants: [] },
  quantity: 2,
  unitPriceEth: '1',
};
const quote: Quote = {
  id: 'q1',
  network: 'ethereum',
  coupon: null,
  subtotalEth: '2',
  discountEth: '0',
  networkFeeEth: '0.0021',
  totalEth: '2.0021',
  expiresAt: '2026-10-29T12:10:00.000Z',
  lines: [{ ...line, lineTotalEth: '2' }],
};
const cartWith = (overrides: Partial<Cart['lines'][number]>): Cart => ({
  lines: [{ ...line, available: 5, maxPerOrder: 5, ...overrides }],
  summary: {
    network: 'ethereum',
    coupon: null,
    subtotalEth: '2',
    discountEth: '0',
    networkFeeEth: '0.0021',
    totalEth: '2.0021',
  },
  version: 1,
});

describe('isQuoteStale', () => {
  it('is fresh while the cart matches the quote', () => {
    expect(isQuoteStale(quote, cartWith({}))).toBe(false);
  });

  it.each([
    ['the price changed', { unitPriceEth: '1.1' }],
    ['availability dropped below the quantity', { available: 1 }],
    ['the quantity changed', { quantity: 1 }],
  ])('is stale when %s', (_reason, overrides) => {
    expect(isQuoteStale(quote, cartWith(overrides))).toBe(true);
  });
});
