import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { useCallback } from 'react';
import type { NftListQuery } from '@/contracts/nft';
import { catalogSearchSchema, DEFAULT_CATALOG_SEARCH } from '@/features/catalog/catalog-search';
import {
  FiltersDrawer,
  FiltersSidebar,
  SearchBox,
  SortSelect,
} from '@/features/catalog/components/catalog-filters';
import { CatalogResults } from '@/features/catalog/components/catalog-results';
import { FeaturedSection } from '@/features/catalog/components/featured-section';
import { featuredNftsQueryOptions, nftListQueryOptions } from '@/features/catalog/queries';
import { noop } from '@/lib/noop';

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(DEFAULT_CATALOG_SEARCH)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) => {
    queryClient.query(featuredNftsQueryOptions).catch(noop);
    queryClient.query(nftListQueryOptions(deps)).catch(noop);
  },
  head: () => ({ meta: [{ title: 'NFT Marketplace · Discover digital art' }] }),
  component: HomePage,
});

function HomePage() {
  const query = Route.useSearch();
  const navigate = Route.useNavigate();
  const changeFilters = useCallback(
    (patch: Partial<NftListQuery>) => {
      void navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }) });
    },
    [navigate],
  );

  return (
    <div className="mx-auto grid max-w-7xl gap-16 px-4 py-10 sm:px-8 sm:py-16">
      <header className="grid max-w-2xl gap-4">
        <h1 className="text-4xl leading-tight font-semibold sm:text-6xl">
          Discover digital art & collect NFTs
        </h1>
        <p className="text-lg text-muted-foreground">
          Browse thousands of editions from independent creators and build your collection.
        </p>
      </header>

      <FeaturedSection />

      <section aria-labelledby="catalog-heading" className="grid gap-6">
        <h2 id="catalog-heading" className="text-2xl font-semibold sm:text-3xl">
          Browse marketplace
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <SearchBox query={query} onChange={changeFilters} />
          <SortSelect query={query} onChange={changeFilters} />
          <FiltersDrawer query={query} onChange={changeFilters} />
        </div>
        <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
          <FiltersSidebar query={query} onChange={changeFilters} />
          <CatalogResults query={query} />
        </div>
      </section>
    </div>
  );
}
