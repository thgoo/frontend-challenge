import { z } from 'zod';
import { ethAmountSchema, idSchema, paginatedSchema, timestampSchema } from './common';

export const nftCategorySchema = z.enum([
  'art',
  'collectibles',
  'music',
  'photography',
  'video',
  'utility',
  'sport',
  'virtual-worlds',
]);
export type NftCategory = z.infer<typeof nftCategorySchema>;

export const editionSchema = z.object({
  id: idSchema,
  name: z.string(),
  priceEth: ethAmountSchema,
  supply: z.number().int().positive(),
  available: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
});
export type Edition = z.infer<typeof editionSchema>;

export const nftImageSchema = z.object({ url: z.string(), alt: z.string() });

export const creatorSchema = z.object({
  id: idSchema,
  name: z.string(),
  avatarUrl: z.string(),
});

export const nftSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  category: nftCategorySchema,
  tags: z.array(z.string()),
  images: z.array(nftImageSchema).min(1),
  creator: creatorSchema,
  editions: z.array(editionSchema).min(1),
  featured: z.boolean(),
  createdAt: timestampSchema,
  /** Monotonic version shared with `nft.updated` events. */
  version: z.number().int().nonnegative(),
});
export type Nft = z.infer<typeof nftSchema>;

export const nftSortSchema = z.enum(['newest', 'price-asc', 'price-desc', 'name-asc']);
export type NftSort = z.infer<typeof nftSortSchema>;

export const NFT_PAGE_SIZE = 12;

/** Doubles as the catalog route search schema, so the URL and the API share one shape. */
export const nftListQuerySchema = z.object({
  q: z.string().trim().optional(),
  categories: z.array(nftCategorySchema).optional(),
  minPrice: ethAmountSchema.optional(),
  maxPrice: ethAmountSchema.optional(),
  onlyAvailable: z.boolean().optional(),
  sort: nftSortSchema.default('newest'),
  page: z.number().int().positive().default(1),
});
export type NftListQuery = z.infer<typeof nftListQuerySchema>;

export const nftListResponseSchema = paginatedSchema(nftSchema);
export type NftListResponse = z.infer<typeof nftListResponseSchema>;

/** Query-string transport shared by the Axios client and the MSW handler. */
export function toNftListSearchParams(query: NftListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  for (const category of query.categories ?? []) params.append('categories', category);
  if (query.minPrice) params.set('minPrice', query.minPrice);
  if (query.maxPrice) params.set('maxPrice', query.maxPrice);
  if (query.onlyAvailable) params.set('onlyAvailable', 'true');
  params.set('sort', query.sort);
  params.set('page', String(query.page));
  return params;
}

export function parseNftListSearchParams(params: URLSearchParams) {
  const categories = params.getAll('categories');
  const page = params.get('page');
  return nftListQuerySchema.safeParse({
    q: params.get('q') ?? undefined,
    categories: categories.length > 0 ? categories : undefined,
    minPrice: params.get('minPrice') ?? undefined,
    maxPrice: params.get('maxPrice') ?? undefined,
    onlyAvailable: params.get('onlyAvailable') === 'true' || undefined,
    sort: params.get('sort') ?? undefined,
    page: page === null ? undefined : Number(page),
  });
}
