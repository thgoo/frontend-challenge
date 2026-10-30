import { Link } from '@tanstack/react-router';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { EthAmount } from '@/components/eth-amount';
import { NftImage } from '@/components/nft-image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Nft } from '@/contracts/nft';
import { useAddCartItem } from '@/features/cart/queries';
import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import { errorMessage } from '@/i18n/api-errors';
import { cheapestEdition } from '@/lib/nft';

const CARD_IMAGE_SIZES = '(min-width: 1024px) 250px, 45vw';

function QuickAddButton({ nft }: { nft: Nft }) {
  const addItem = useAddCartItem();
  const edition = nft.editions.find((candidate) => candidate.available > 0);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Adicionar ${nft.name} ao carrinho`}
      disabled={!edition || addItem.isPending}
      className="bg-background/80 hover:bg-background"
      onClick={() => {
        if (!edition) return;
        addItem.mutate(
          { nftId: nft.id, editionId: edition.id, quantity: 1 },
          {
            onSuccess: () => toast.success(`“${nft.name}” (${edition.name}) foi para o carrinho.`),
            onError: (error) => toast.error(errorMessage(error)),
          },
        );
      }}
    >
      <ShoppingCart aria-hidden="true" />
    </Button>
  );
}

export function NftCard({ nft, priority = false }: { nft: Nft; priority?: boolean }) {
  const edition = cheapestEdition(nft);
  const soldOut = !nft.editions.some((candidate) => candidate.available > 0);

  return (
    <article className="group relative grid gap-3">
      <div className="relative grid aspect-[258/300] place-items-center bg-card p-1 max-lg:aspect-[175/200] max-lg:rounded-[20px] max-lg:p-0">
        <NftImage
          image={nft.images[0]}
          sizes={CARD_IMAGE_SIZES}
          priority={priority}
          className="aspect-square w-full rounded-[15px] max-lg:aspect-auto max-lg:h-full max-lg:rounded-[20px]"
        />
        {nft.rare && (
          <span className="absolute top-0 left-0 bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
            RARO
          </span>
        )}
        {soldOut && (
          <span className="absolute top-2 right-2 rounded bg-background/90 px-2 py-1 text-xs font-bold lg:top-3 lg:right-3">
            Esgotado
          </span>
        )}
        <div className="absolute right-2 bottom-2 z-10 flex gap-2 motion-reduce:transition-none lg:right-auto lg:bottom-4 lg:left-1/2 lg:-translate-x-1/2 lg:opacity-0 lg:transition-opacity lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
          <span className="max-lg:hidden">
            <QuickAddButton nft={nft} />
          </span>
          <FavoriteButton nftId={nft.id} nftName={nft.name} variant="icon" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <h3 className="truncate text-base leading-4">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-baseline gap-x-3 text-base font-bold text-highlight lg:text-lg">
          <EthAmount value={edition.priceEth} />
          {edition.compareAtPriceEth && (
            <s className="font-normal text-subtle">
              <span className="sr-only">Preço anterior: </span>
              <EthAmount value={edition.compareAtPriceEth} />
            </s>
          )}
        </p>
      </div>
    </article>
  );
}

export function NftCardSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="aspect-[258/300] w-full rounded-none max-lg:aspect-[175/200] max-lg:rounded-[20px]" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
