import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { NftListQuery } from '@/contracts/nft';
import { fetchFeaturedNfts, fetchNft, fetchNftFacets, fetchNftReviews, fetchNfts } from './api';

export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (query: NftListQuery) => [...nftKeys.lists(), query] as const,
  featured: () => [...nftKeys.all, 'featured'] as const,
  facets: () => [...nftKeys.all, 'facets'] as const,
  detail: (id: string) => [...nftKeys.all, 'detail', id] as const,
  reviews: (id: string) => [...nftKeys.all, 'reviews', id] as const,
};

/** Each query owns its key, so a late response for old filters can never overwrite the current page. */
export function nftListQueryOptions(query: NftListQuery) {
  return queryOptions({
    queryKey: nftKeys.list(query),
    queryFn: ({ signal }) => fetchNfts(query, signal),
    placeholderData: keepPreviousData,
  });
}

export const featuredNftsQueryOptions = queryOptions({
  queryKey: nftKeys.featured(),
  queryFn: ({ signal }) => fetchFeaturedNfts(signal),
});

export const nftFacetsQueryOptions = queryOptions({
  queryKey: nftKeys.facets(),
  queryFn: ({ signal }) => fetchNftFacets(signal),
});

export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => fetchNft(id, signal),
  });
}

export function nftReviewsQueryOptions(id: string) {
  return queryOptions({
    queryKey: nftKeys.reviews(id),
    queryFn: ({ signal }) => fetchNftReviews(id, signal),
  });
}
