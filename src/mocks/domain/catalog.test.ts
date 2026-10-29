import { describe, expect, it } from 'vitest';
import { NFT_PAGE_SIZE, nftListQuerySchema, type NftListQuery } from '@/contracts/nft';
import { parseEth } from '@/lib/eth';
import { createNftFixtures, NFT_FIXTURE_COUNT } from '../db/fixtures/nfts';
import { isAvailable, lowestPrice, queryCatalog } from './catalog';

const nfts = createNftFixtures(1);
const query = (input: Partial<NftListQuery> = {}) => nftListQuerySchema.parse(input);

describe('queryCatalog', () => {
  it('paginates with stable totals', () => {
    const first = queryCatalog(nfts, query());
    const last = queryCatalog(nfts, query({ page: first.totalPages }));
    expect(first.items).toHaveLength(NFT_PAGE_SIZE);
    expect(first.total).toBe(NFT_FIXTURE_COUNT);
    expect(last.items.length).toBeGreaterThan(0);
  });

  it('combines category, price and availability filters', () => {
    const result = queryCatalog(
      nfts,
      query({ categories: ['art', 'music'], maxPrice: '1', onlyAvailable: true }),
    );
    expect(result.items.length).toBeGreaterThan(0);
    for (const nft of result.items) {
      expect(['art', 'music']).toContain(nft.category);
      expect(lowestPrice(nft) <= parseEth('1')).toBe(true);
      expect(isAvailable(nft)).toBe(true);
    }
  });

  it('searches by name, creator and tags case-insensitively', () => {
    const target = nfts[5];
    if (!target) throw new Error('fixture missing');
    const result = queryCatalog(nfts, query({ q: target.creator.name.toUpperCase() }));
    expect(result.items.every((nft) => nft.creator.name === target.creator.name)).toBe(true);
  });

  it('sorts by price in both directions', () => {
    const ascending = queryCatalog(nfts, query({ sort: 'price-asc' })).items.map(lowestPrice);
    const descending = queryCatalog(nfts, query({ sort: 'price-desc' })).items.map(lowestPrice);
    expect(ascending).toEqual([...ascending].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
    expect(descending).toEqual([...descending].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0)));
  });

  it('returns an empty page when nothing matches', () => {
    expect(queryCatalog(nfts, query({ q: 'no-such-nft' }))).toMatchObject({
      items: [],
      total: 0,
      totalPages: 0,
    });
  });
});

describe('fixtures', () => {
  it('are deterministic for the same seed', () => {
    expect(createNftFixtures(1)).toEqual(nfts);
  });

  it('cover every category, sold-out editions and multiple pages', () => {
    expect(new Set(nfts.map((nft) => nft.category)).size).toBe(8);
    expect(nfts.some((nft) => nft.editions.some((edition) => edition.available === 0))).toBe(true);
    expect(NFT_FIXTURE_COUNT / NFT_PAGE_SIZE).toBeGreaterThan(2);
  });
});
