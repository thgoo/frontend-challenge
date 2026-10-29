import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { EmptyState, ErrorState } from '@/components/query-states';
import { NFT_PAGE_SIZE, type NftListQuery } from '@/contracts/nft';
import { nftListQueryOptions } from '../queries';
import { NftGrid, NftGridSkeleton } from './nft-grid';
import { Pagination } from './pagination';

export function CatalogResults({ query }: { query: NftListQuery }) {
  const { data, error, isPending, isFetching, isPlaceholderData, refetch } = useQuery(
    nftListQueryOptions(query),
  );

  if (isPending) {
    return (
      <div aria-busy="true">
        <span className="sr-only" role="status">
          Loading NFTs
        </span>
        <NftGridSkeleton count={NFT_PAGE_SIZE / 2} />
      </div>
    );
  }
  if (error) {
    return (
      <ErrorState title="Could not load the catalog" error={error} onRetry={() => void refetch()} />
    );
  }
  if (data.items.length === 0) {
    return (
      <EmptyState title="No NFTs found">
        {data.total > 0 ? (
          <Link to="/" search={(prev) => ({ ...prev, page: 1 })} className="text-primary underline">
            Go to the first page
          </Link>
        ) : (
          'Try another search or remove some filters.'
        )}
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-8" aria-busy={isPlaceholderData}>
      <p role="status" className="text-sm text-muted-foreground">
        {data.total} {data.total === 1 ? 'NFT' : 'NFTs'} found
        {isFetching && <span> · Updating…</span>}
      </p>
      <div
        className={
          isPlaceholderData
            ? 'opacity-60 transition-opacity motion-reduce:transition-none'
            : undefined
        }
      >
        <NftGrid nfts={data.items} />
      </div>
      <Pagination page={data.page} totalPages={data.totalPages} />
    </div>
  );
}
