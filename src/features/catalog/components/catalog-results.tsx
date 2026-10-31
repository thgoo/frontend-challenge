import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import { EmptyState, ErrorState } from '@/components/query-states';
import { NFT_PAGE_SIZE, type NftListQuery } from '@/contracts/nft';
import { plural } from '@/i18n/locale';
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
          Carregando NFTs
        </span>
        <NftGridSkeleton count={NFT_PAGE_SIZE / 2} />
      </div>
    );
  }
  if (error) {
    return (
      <ErrorState
        title="Não foi possível carregar o catálogo"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }
  if (data.items.length === 0) {
    return (
      <EmptyState title="Nenhum NFT encontrado">
        {data.total > 0 ? (
          <Link
            to="/"
            search={(prev) => ({ ...prev, page: 1 })}
            hash="mercado"
            className="text-highlight underline"
          >
            Voltar para a primeira página
          </Link>
        ) : (
          'Tente outra busca ou remova alguns filtros.'
        )}
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-12 lg:gap-[88px]" aria-busy={isPlaceholderData}>
      <p role="status" className="sr-only">
        {data.total} {plural(data.total, { one: 'NFT encontrado', other: 'NFTs encontrados' })}
        {isFetching && ', atualizando'}
      </p>
      <div
        className={cn(
          isPlaceholderData && 'opacity-60 transition-opacity motion-reduce:transition-none',
        )}
      >
        <NftGrid nfts={data.items} eager={query.page === 1} />
      </div>
      <Pagination page={data.page} totalPages={data.totalPages} />
    </div>
  );
}
