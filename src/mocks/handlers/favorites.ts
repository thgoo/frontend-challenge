import { http, HttpResponse } from 'msw';
import type { Favorites } from '@/contracts/favorites';
import { readDb, transaction } from '../db/store';
import { apiPath } from '../http/api';
import { apiError } from '../http/responses';
import { authenticate } from '../http/session';

type Params = { nftId: string };

function favoritesOf(userId: string): Favorites {
  return { nftIds: readDb().favorites[userId] ?? [] };
}

export const favoriteHandlers = [
  http.get(apiPath('/favorites'), ({ cookies }) => {
    const auth = authenticate(cookies);
    return auth.ok ? HttpResponse.json(favoritesOf(auth.user.id)) : auth.response;
  }),

  http.put<Params>(apiPath('/favorites/:nftId'), ({ params, cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    if (!readDb().nfts.some((nft) => nft.id === params.nftId)) {
      return apiError(404, 'NOT_FOUND', 'This NFT does not exist.');
    }
    transaction(({ db }) => {
      const current = db.favorites[auth.user.id] ?? [];
      if (!current.includes(params.nftId)) db.favorites[auth.user.id] = [...current, params.nftId];
    });
    return HttpResponse.json(favoritesOf(auth.user.id));
  }),

  http.delete<Params>(apiPath('/favorites/:nftId'), ({ params, cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    transaction(({ db }) => {
      db.favorites[auth.user.id] = (db.favorites[auth.user.id] ?? []).filter(
        (id) => id !== params.nftId,
      );
    });
    return HttpResponse.json(favoritesOf(auth.user.id));
  }),
];
