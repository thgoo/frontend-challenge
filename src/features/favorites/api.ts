import { z } from 'zod';
import { favoritesSchema } from '@/contracts/favorites';
import { nftSchema } from '@/contracts/nft';
import { request } from '@/lib/http';

export function fetchFavorites(signal?: AbortSignal) {
  return request(favoritesSchema, { url: '/favorites', signal });
}

export function fetchFavoriteNfts(signal?: AbortSignal) {
  return request(z.array(nftSchema), { url: '/favorites/nfts', signal });
}

export function setFavorite(nftId: string, favorite: boolean) {
  return request(favoritesSchema, {
    method: favorite ? 'PUT' : 'DELETE',
    url: `/favorites/${encodeURIComponent(nftId)}`,
  });
}
