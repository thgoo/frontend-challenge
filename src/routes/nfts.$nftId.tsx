import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ErrorState } from '@/components/query-states';
import {
  NftDetail,
  NftDetailSkeleton,
  NftNotFound,
} from '@/features/catalog/components/nft-detail';
import { nftDetailQueryOptions } from '@/features/catalog/queries';
import { hasErrorCode } from '@/lib/api-error';
import { noop } from '@/lib/noop';

export const Route = createFileRoute('/nfts/$nftId')({
  loader: ({ context: { queryClient }, params }) => {
    queryClient.query(nftDetailQueryOptions(params.nftId)).catch(noop);
  },
  component: NftDetailPage,
});

function NftDetailPage() {
  const { nftId } = Route.useParams();
  const { data, error, isPending, refetch } = useQuery(nftDetailQueryOptions(nftId));

  if (isPending) return <NftDetailSkeleton />;
  if (hasErrorCode(error, 'NOT_FOUND')) return <NftNotFound />;
  if (error)
    return (
      <ErrorState title="Could not load this NFT" error={error} onRetry={() => void refetch()} />
    );
  return <NftDetail nft={data} />;
}
