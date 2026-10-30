import { z } from 'zod';
import {
  nftFacetsSchema,
  nftListResponseSchema,
  reviewSchema,
  nftSchema,
  toNftListSearchParams,
  type NftListQuery,
} from '@/contracts/nft';
import { request } from '@/lib/http';

export function fetchNfts(query: NftListQuery, signal?: AbortSignal) {
  return request(nftListResponseSchema, {
    url: '/nfts',
    params: toNftListSearchParams(query),
    signal,
  });
}

export function fetchNftFacets(signal?: AbortSignal) {
  return request(nftFacetsSchema, { url: '/nfts/facets', signal });
}

export function fetchFeaturedNfts(signal?: AbortSignal) {
  return request(z.array(nftSchema), { url: '/nfts/featured', signal });
}

export function fetchNftReviews(id: string, signal?: AbortSignal) {
  return request(z.array(reviewSchema), {
    url: `/nfts/${encodeURIComponent(id)}/reviews`,
    signal,
  });
}

export function fetchNft(id: string, signal?: AbortSignal) {
  return request(nftSchema, { url: `/nfts/${encodeURIComponent(id)}`, signal });
}
