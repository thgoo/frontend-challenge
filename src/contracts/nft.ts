import { z } from 'zod';
import { ethAmountSchema, idSchema, paginatedSchema, timestampSchema } from './common';
import { networkSchema } from './wallet';

export const nftCategorySchema = z.enum([
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
]);
export type NftCategory = z.infer<typeof nftCategorySchema>;

export const editionSchema = z.object({
  id: idSchema,
  name: z.string(),
  priceEth: ethAmountSchema,
  supply: z.number().int().positive(),
  available: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
  /** Price before a markdown, shown struck through. */
  compareAtPriceEth: ethAmountSchema.nullable(),
});
export type Edition = z.infer<typeof editionSchema>;

export const imageVariantSchema = z.object({
  url: z.string(),
  width: z.number().int().positive(),
  type: z.enum(['image/avif', 'image/webp']),
});

/** `url` is the universal fallback; variants let the browser pick format and size. */
export const nftImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  variants: z.array(imageVariantSchema),
});
export type NftImage = z.infer<typeof nftImageSchema>;

export const creatorSchema = z.object({ id: idSchema, name: z.string() });

export const nftSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  category: nftCategorySchema,
  network: networkSchema,
  collection: z.string(),
  tokenId: z.string(),
  tags: z.array(z.string()),
  images: z.tuple([nftImageSchema], nftImageSchema),
  creator: creatorSchema,
  editions: z.array(editionSchema).min(1),
  featured: z.boolean(),
  trending: z.boolean(),
  /** Curated rarity badge ("Raro"), independent from edition supply. */
  rare: z.boolean(),
  createdAt: timestampSchema,
  /** Monotonic version shared with `nft.updated` events. */
  version: z.number().int().nonnegative(),
});
export type Nft = z.infer<typeof nftSchema>;

export const nftViewSchema = z.enum(['all', 'new', 'trending']);
export type NftView = z.infer<typeof nftViewSchema>;

export const nftSortSchema = z.enum(['newest', 'price-asc', 'price-desc', 'name-asc']);
export type NftSort = z.infer<typeof nftSortSchema>;

export const NFT_PAGE_SIZE = 12;

/** Doubles as the catalog route search schema, so the URL and the API share one shape. */
export const nftListQuerySchema = z.object({
  q: z.string().trim().optional(),
  view: nftViewSchema.default('all'),
  categories: z.array(nftCategorySchema).optional(),
  networks: z.array(networkSchema).optional(),
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
  params.set('view', query.view);
  for (const category of query.categories ?? []) params.append('categories', category);
  for (const network of query.networks ?? []) params.append('networks', network);
  if (query.minPrice) params.set('minPrice', query.minPrice);
  if (query.maxPrice) params.set('maxPrice', query.maxPrice);
  if (query.onlyAvailable) params.set('onlyAvailable', 'true');
  params.set('sort', query.sort);
  params.set('page', String(query.page));
  return params;
}

export function parseNftListSearchParams(params: URLSearchParams) {
  const list = (name: string) => {
    const values = params.getAll(name);
    return values.length > 0 ? values : undefined;
  };
  const page = params.get('page');
  return nftListQuerySchema.safeParse({
    q: params.get('q') ?? undefined,
    view: params.get('view') ?? undefined,
    categories: list('categories'),
    networks: list('networks'),
    minPrice: params.get('minPrice') ?? undefined,
    maxPrice: params.get('maxPrice') ?? undefined,
    onlyAvailable: params.get('onlyAvailable') === 'true' || undefined,
    sort: params.get('sort') ?? undefined,
    page: page === null ? undefined : Number(page),
  });
}

/** Catalog-wide counts for the filter sidebar, independent of the active filters. */
export const nftFacetsSchema = z.object({
  categories: z.record(nftCategorySchema, z.number().int().nonnegative()),
  networks: z.record(networkSchema, z.number().int().nonnegative()),
  priceRange: z.object({ min: ethAmountSchema, max: ethAmountSchema }),
});
export type NftFacets = z.infer<typeof nftFacetsSchema>;
