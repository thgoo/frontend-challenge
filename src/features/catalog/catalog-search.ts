import { z } from 'zod';
import { nftListQuerySchema } from '@/contracts/nft';

const { q, categories, minPrice, maxPrice, onlyAvailable, sort, page } = nftListQuerySchema.shape;

/** The API contract with per-field fallbacks: a bad or outdated URL degrades to defaults instead of failing. */
export const catalogSearchSchema = z.object({
  q: q.catch(undefined),
  categories: categories.catch(undefined),
  minPrice: minPrice.catch(undefined),
  maxPrice: maxPrice.catch(undefined),
  onlyAvailable: onlyAvailable.catch(undefined),
  sort: sort.catch('newest'),
  page: page.catch(1),
});

export const DEFAULT_CATALOG_SEARCH = { sort: 'newest', page: 1 } as const;
