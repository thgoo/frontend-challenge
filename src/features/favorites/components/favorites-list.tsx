import { useQueries } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { EmptyState, ErrorState } from '@/components/query-states';
import { NftGrid, NftGridSkeleton } from '@/features/catalog/components/nft-grid';
import { nftDetailQueryOptions } from '@/features/catalog/queries';
import { useFavorites } from '../queries';

export function FavoritesList() {
  const favorites = useFavorites();
  const ids = favorites.data?.nftIds ?? [];
  const nfts = useQueries({
    queries: ids.map((id) => nftDetailQueryOptions(id)),
    combine: (results) => ({
      data: results.flatMap((result) => (result.data ? [result.data] : [])),
      isPending: results.some((result) => result.isPending),
      failed: results.filter((result) => result.error),
    }),
  });

  const error = favorites.error ?? nfts.failed[0]?.error;
  if (error) {
    return (
      <ErrorState
        title="Não foi possível carregar seus favoritos"
        error={error}
        onRetry={() => {
          if (favorites.error) void favorites.refetch();
          for (const result of nfts.failed) void result.refetch();
        }}
      />
    );
  }
  if (favorites.isPending || nfts.isPending) {
    return (
      <div aria-busy="true">
        <span className="sr-only" role="status">
          Carregando favoritos
        </span>
        <NftGridSkeleton count={Math.max(ids.length, 3)} />
      </div>
    );
  }
  if (nfts.data.length === 0) {
    return (
      <EmptyState title="Você ainda não favoritou nenhum NFT">
        <Link to="/" hash="mercado" className="text-highlight underline">
          Explorar o mercado
        </Link>
      </EmptyState>
    );
  }
  return <NftGrid nfts={nfts.data} />;
}
