import { http, HttpResponse } from 'msw';
import { parseNftListSearchParams } from '@/contracts/nft';
import { catalogFacets, queryCatalog } from '../domain/catalog';
import { readDb } from '../db/store';
import { apiPath } from '../http/api';
import { apiError, validationError } from '../http/responses';

export const nftHandlers = [
  http.get(apiPath('/nfts'), ({ request }) => {
    const query = parseNftListSearchParams(new URL(request.url).searchParams);
    if (!query.success) return validationError(query.error);
    return HttpResponse.json(queryCatalog(readDb().nfts, query.data));
  }),

  http.get(apiPath('/nfts/facets'), () => HttpResponse.json(catalogFacets(readDb().nfts))),

  http.get(apiPath('/nfts/featured'), () =>
    HttpResponse.json(readDb().nfts.filter((nft) => nft.featured)),
  ),

  http.get<{ id: string }>(apiPath('/nfts/:id'), ({ params }) => {
    const nft = readDb().nfts.find((candidate) => candidate.id === params.id);
    if (!nft) return apiError(404, 'NOT_FOUND', 'This NFT does not exist.');
    return HttpResponse.json(nft);
  }),
];
