import { NFT_PAGE_SIZE, type Nft, type NftListQuery, type NftListResponse } from '@/contracts/nft';
import { parseEth } from '@/lib/eth';

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

function matchesText(nft: Nft, text: string): boolean {
  const needle = text.toLowerCase();
  return [nft.name, nft.creator.name, ...nft.tags].some((value) =>
    value.toLowerCase().includes(needle),
  );
}

function matches(nft: Nft, query: NftListQuery): boolean {
  const price = lowestPrice(nft);
  return (
    (!query.q || matchesText(nft, query.q)) &&
    (!query.categories?.length || query.categories.includes(nft.category)) &&
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
  const compare = comparators[query.sort];
  const filtered = nfts
    .filter((nft) => matches(nft, query))
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
