import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { useCallback } from 'react';
import {
  catalogQuery,
  catalogSearchSchema,
  DEFAULT_CATALOG_SEARCH,
} from '@/features/catalog/catalog-search';
import {
  FiltersPanel,
  MobileCatalogBar,
  type FilterPatch,
} from '@/features/catalog/components/catalog-filters';
import { CatalogResults } from '@/features/catalog/components/catalog-results';
import { CatalogToolbar } from '@/features/catalog/components/catalog-toolbar';
import {
  featuredNftsQueryOptions,
  nftFacetsQueryOptions,
  nftListQueryOptions,
} from '@/features/catalog/queries';
import { FeaturedBanner } from '@/features/home/components/featured-banner';
import { Hero } from '@/features/home/components/hero';
import { Journal } from '@/features/home/components/journal';
import { Promos } from '@/features/home/components/promos';
import { noop } from '@/lib/noop';

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(DEFAULT_CATALOG_SEARCH)] },
  loaderDeps: ({ search }) => catalogQuery(search),
  loader: ({ context: { queryClient }, deps }) => {
    queryClient.query(featuredNftsQueryOptions).catch(noop);
    queryClient.query(nftFacetsQueryOptions).catch(noop);
    queryClient.query(nftListQueryOptions(deps)).catch(noop);
  },
  head: () => ({ meta: [{ title: 'Kurio · Seja dono do futuro da arte digital' }] }),
  component: HomePage,
});

function HomePage() {
  const query = Route.useSearch({ select: catalogQuery, structuralSharing: true });
  const navigate = Route.useNavigate();
  const changeFilters = useCallback(
    (patch: FilterPatch) => {
      void navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }), resetScroll: false });
    },
    [navigate],
  );

  return (
    <div className="page-container grid grid-cols-1 gap-4 pt-10 lg:gap-24 lg:pt-8">
      <MobileCatalogBar query={query} onChange={changeFilters} />
      <Hero />
      <section
        id="mercado"
        aria-labelledby="market-heading"
        className="grid scroll-mt-6 grid-cols-1 gap-8 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-12"
      >
        {/* The Figma has no visible title here; the heading keeps the outline from h1 to the cards. */}
        <h2 id="market-heading" className="sr-only">
          Mercado
        </h2>
        <div className="hidden content-start gap-6 lg:grid">
          <FiltersPanel query={query} onChange={changeFilters} />
          <FeaturedBanner />
        </div>
        <div className="grid grid-cols-1 content-start gap-4 lg:gap-8">
          <CatalogToolbar query={query} onChange={changeFilters} />
          <CatalogResults query={query} />
        </div>
      </section>
      <Promos />
      <Journal />
    </div>
  );
}
