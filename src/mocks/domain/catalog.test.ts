import { describe, expect, it } from 'vitest';
import { NFT_PAGE_SIZE, nftListQuerySchema, type NftListQuery } from '@/contracts/nft';
import { parseEth } from '@/lib/eth';
import { createNftFixtures, NFT_FIXTURE_COUNT } from '../db/fixtures/nfts';
import { createReviews, ratingOf } from '../db/fixtures/reviews';
import { isAvailable, lowestPrice } from '@/lib/nft';
import { catalogFacets, queryCatalog } from './catalog';

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
      query({ categories: ['digital-art', 'music'], maxPrice: '1', onlyAvailable: true }),
    );
    expect(result.items.length).toBeGreaterThan(0);
    for (const nft of result.items) {
      expect(['digital-art', 'music']).toContain(nft.category);
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

  it('filters by network and by the new and trending views', () => {
    const polygon = queryCatalog(nfts, query({ networks: ['polygon'] }));
    expect(polygon.total).toBeGreaterThan(0);
    expect(polygon.items.every((nft) => nft.network === 'polygon')).toBe(true);

    const trending = queryCatalog(nfts, query({ view: 'trending' }));
    expect(trending.total).toBe(nfts.filter((nft) => nft.trending).length);

    const fresh = queryCatalog(nfts, query({ view: 'new' }));
    expect(fresh.total).toBeGreaterThan(0);
    expect(fresh.total).toBeLessThan(nfts.length);
  });

  it('returns an empty page when nothing matches', () => {
    expect(queryCatalog(nfts, query({ q: 'no-such-nft' }))).toMatchObject({
      items: [],
      total: 0,
      totalPages: 0,
    });
  });
});

describe('catalogFacets', () => {
  it('counts every category and network, and spans the price range', () => {
    const facets = catalogFacets(nfts);
    const total = (counts: Record<string, number>) =>
      Object.values(counts).reduce((sum, count) => sum + count, 0);
    expect(total(facets.categories)).toBe(nfts.length);
    expect(total(facets.networks)).toBe(nfts.length);
    const prices = nfts.map(lowestPrice);
    expect(parseEth(facets.priceRange.min)).toBe(prices.reduce((a, b) => (b < a ? b : a)));
    expect(parseEth(facets.priceRange.max)).toBe(prices.reduce((a, b) => (b > a ? b : a)));
  });
});

describe('fixtures', () => {
  it('start with the pieces drawn in the Figma', () => {
    const showcase = createNftFixtures(1).slice(0, 3);
    expect(showcase.map((nft) => nft.name)).toEqual([
      'Emerald Ape #042',
      'Sage Nomad #009',
      'Neon Vessel #552',
    ]);
    expect(showcase[2]?.editions[0]).toMatchObject({ priceEth: '1.99', compareAtPriceEth: '2.29' });
  });

  it('advertise the rating of the reviews they serve', () => {
    for (const nft of nfts.slice(0, 5)) {
      expect(nft.rating).toEqual(ratingOf(createReviews(nft.id)));
      expect(nft.rating.count).toBeGreaterThan(0);
    }
  });

  it('are deterministic for the same seed', () => {
    expect(createNftFixtures(1)).toEqual(nfts);
  });

  it('cover every category, sold-out editions and multiple pages', () => {
    expect(new Set(nfts.map((nft) => nft.category)).size).toBe(9);
    expect(nfts.some((nft) => nft.editions.some((edition) => edition.available === 0))).toBe(true);
    expect(NFT_FIXTURE_COUNT / NFT_PAGE_SIZE).toBeGreaterThan(2);
  });
});
