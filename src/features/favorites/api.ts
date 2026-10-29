import { favoritesSchema } from '@/contracts/favorites';
import { request } from '@/lib/http';

export function fetchFavorites(signal?: AbortSignal) {
  return request(favoritesSchema, { url: '/favorites', signal });
}

export function setFavorite(nftId: string, favorite: boolean) {
  return request(favoritesSchema, {
    method: favorite ? 'PUT' : 'DELETE',
    url: `/favorites/${encodeURIComponent(nftId)}`,
  });
}
