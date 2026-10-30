import { describe, expect, it } from 'vitest';
import { nftListQuerySchema, parseNftListSearchParams, toNftListSearchParams } from './nft';

describe('nft list query transport', () => {
  it('round-trips through URLSearchParams', () => {
    const query = nftListQuerySchema.parse({
      q: 'golden',
      view: 'trending',
      categories: ['digital-art', 'music'],
      networks: ['polygon', 'base'],
      minPrice: '0.1',
      maxPrice: '2.5',
      onlyAvailable: true,
      sort: 'price-asc',
      page: 3,
    });
    const parsed = parseNftListSearchParams(toNftListSearchParams(query));
    expect(parsed.success && parsed.data).toEqual(query);
  });

  it('applies defaults for an empty query string', () => {
    const parsed = parseNftListSearchParams(new URLSearchParams());
    expect(parsed.success && parsed.data).toEqual({ view: 'all', sort: 'newest', page: 1 });
  });

  it('rejects invalid values', () => {
    expect(parseNftListSearchParams(new URLSearchParams('page=0')).success).toBe(false);
    expect(parseNftListSearchParams(new URLSearchParams('categories=nope')).success).toBe(false);
    expect(parseNftListSearchParams(new URLSearchParams('minPrice=1e3')).success).toBe(false);
    expect(parseNftListSearchParams(new URLSearchParams('networks=solana')).success).toBe(false);
  });
});
