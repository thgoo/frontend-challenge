import { z } from 'zod';
import { nftListQuerySchema } from '@/contracts/nft';

const { q, view, categories, networks, minPrice, maxPrice, onlyAvailable, sort, page } =
  nftListQuerySchema.shape;

/** The API contract with per-field fallbacks: a bad or outdated URL degrades to defaults instead of failing. */
export const catalogSearchSchema = z.object({
  q: q.catch(undefined),
  view: view.catch('all'),
  categories: categories.catch(undefined),
  networks: networks.catch(undefined),
  minPrice: minPrice.catch(undefined),
  maxPrice: maxPrice.catch(undefined),
  onlyAvailable: onlyAvailable.catch(undefined),
  sort: sort.catch('newest'),
  page: page.catch(1),
});

export type CatalogSearch = z.infer<typeof catalogSearchSchema>;

/** Route search also carries global params (`?auth=`); the catalog query keeps only its own. */
export function catalogQuery({
  q,
  view,
  categories,
  networks,
  minPrice,
  maxPrice,
  onlyAvailable,
  sort,
  page,
}: CatalogSearch): CatalogSearch {
  return { q, view, categories, networks, minPrice, maxPrice, onlyAvailable, sort, page };
}

export const DEFAULT_CATALOG_SEARCH = { view: 'all', sort: 'newest', page: 1 } as const;
