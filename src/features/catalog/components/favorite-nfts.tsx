import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { EmptyState, ErrorState } from '@/components/query-states';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import { favoriteNftsQueryOptions, useFavorites } from '@/features/favorites/queries';
import { NftGrid, NftGridSkeleton } from './nft-grid';

export function FavoriteNfts() {
  const nfts = useQuery(favoriteNftsQueryOptions(useCurrentUserId()));
  const count = useFavorites().data?.nftIds.length ?? 0;

  if (nfts.error) {
    return (
      <ErrorState
        title="Não foi possível carregar seus favoritos"
        error={nfts.error}
        onRetry={() => void nfts.refetch()}
      />
    );
  }
  if (nfts.isPending) {
    return (
      <div aria-busy="true">
        <span className="sr-only" role="status">
          Carregando favoritos
        </span>
        <NftGridSkeleton count={Math.max(count, 3)} />
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
