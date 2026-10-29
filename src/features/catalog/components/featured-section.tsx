import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/query-states';
import { featuredNftsQueryOptions } from '../queries';
import { NftGrid, NftGridSkeleton } from './nft-grid';

const FEATURED_COUNT = 3;

export function FeaturedSection() {
  const { data, error, isPending, refetch } = useQuery(featuredNftsQueryOptions);
  if (data?.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="grid gap-6">
      <h2 id="featured-heading" className="text-2xl font-semibold sm:text-3xl">
        Featured NFTs
      </h2>
      {isPending ? (
        <NftGridSkeleton count={FEATURED_COUNT} />
      ) : error ? (
        <ErrorState
          title="Could not load featured NFTs"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : (
        <NftGrid nfts={data} />
      )}
    </section>
  );
}
