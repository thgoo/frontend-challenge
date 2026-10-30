import {
  NFT_PAGE_SIZE,
  nftCategorySchema,
  type Nft,
  type NftFacets,
  type NftListQuery,
  type NftListResponse,
} from '@/contracts/nft';
import { networkSchema } from '@/contracts/wallet';
import { formatEth, parseEth } from '@/lib/eth';
import { isAvailable, lowestPrice } from '@/lib/nft';

const DAY_MS = 86_400_000;
/** "New releases" are relative to the latest mint, so the fixtures never age out of the tab. */
const NEW_RELEASE_WINDOW_MS = 14 * DAY_MS;

function matchesText(nft: Nft, text: string): boolean {
  const needle = text.toLowerCase();
  return [nft.name, nft.creator.name, nft.collection, ...nft.tags].some((value) =>
    value.toLowerCase().includes(needle),
  );
}

function matchesView(nft: Nft, query: NftListQuery, latestMint: number): boolean {
  switch (query.view) {
    case 'all':
      return true;
    case 'new':
      return Date.parse(nft.createdAt) > latestMint - NEW_RELEASE_WINDOW_MS;
    case 'trending':
      return nft.trending;
  }
}

function matches(nft: Nft, query: NftListQuery, latestMint: number): boolean {
  const price = lowestPrice(nft);
  return (
    matchesView(nft, query, latestMint) &&
    (!query.q || matchesText(nft, query.q)) &&
    (!query.categories?.length || query.categories.includes(nft.category)) &&
    (!query.networks?.length || query.networks.includes(nft.network)) &&
    (!query.minPrice || price >= parseEth(query.minPrice)) &&
    (!query.maxPrice || price <= parseEth(query.maxPrice)) &&
    (!query.onlyAvailable || isAvailable(nft))
  );
}

function compareBigint(a: bigint, b: bigint): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

const comparators: Record<NftListQuery['sort'], (a: Nft, b: Nft) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  'price-asc': (a, b) => compareBigint(lowestPrice(a), lowestPrice(b)),
  'price-desc': (a, b) => compareBigint(lowestPrice(b), lowestPrice(a)),
  'name-asc': (a, b) => a.name.localeCompare(b.name),
};

/** Ties fall back to the id so pagination is stable across requests. */
export function queryCatalog(nfts: readonly Nft[], query: NftListQuery): NftListResponse {
  const latestMint = Math.max(...nfts.map((nft) => Date.parse(nft.createdAt)));
  const compare = comparators[query.sort];
  const filtered = nfts
    .filter((nft) => matches(nft, query, latestMint))
    .sort((a, b) => compare(a, b) || a.id.localeCompare(b.id));
  const start = (query.page - 1) * NFT_PAGE_SIZE;

  return {
    items: filtered.slice(start, start + NFT_PAGE_SIZE),
    page: query.page,
    pageSize: NFT_PAGE_SIZE,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / NFT_PAGE_SIZE),
  };
}

function countBy<K extends string>(keys: readonly K[], values: readonly K[]): Record<K, number> {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
  for (const value of values) counts[value] += 1;
  return counts;
}

export function catalogFacets(nfts: readonly Nft[]): NftFacets {
  const prices = nfts.map(lowestPrice);
  const min = prices.reduce((a, b) => (b < a ? b : a), prices[0] ?? 0n);
  const max = prices.reduce((a, b) => (b > a ? b : a), 0n);
  return {
    categories: countBy(
      nftCategorySchema.options,
      nfts.map((nft) => nft.category),
    ),
    networks: countBy(
      networkSchema.options,
      nfts.map((nft) => nft.network),
    ),
    priceRange: { min: formatEth(min), max: formatEth(max) },
  };
}
