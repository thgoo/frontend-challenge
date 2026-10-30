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

export const DEFAULT_CATALOG_SEARCH = { view: 'all', sort: 'newest', page: 1 } as const;
