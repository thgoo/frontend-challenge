import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
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

interface NftCardProps {
  nft: Nft;
  priority?: boolean;
  /** Suggestion shelves use smaller text than the catalog grid, as in the Figma. */
  compact?: boolean;
}

export function NftCard({ nft, priority = false, compact = false }: NftCardProps) {
  const edition = cheapestEdition(nft);
  const soldOut = !nft.editions.some((candidate) => candidate.available > 0);

  return (
    <article className="group relative grid gap-3 max-lg:gap-2">
      <div className="relative grid aspect-[258/300] place-items-center bg-card p-1 max-lg:aspect-[175/200] max-lg:rounded-[20px] max-lg:bg-linear-to-br max-lg:from-card max-lg:to-muted max-lg:px-1 max-lg:py-0">
        <NftImage
          image={nft.images[0]}
          sizes={CARD_IMAGE_SIZES}
          priority={priority}
          className="aspect-square w-full rounded-[15px] max-lg:rounded-2xl"
        />
        {nft.rare && (
          <span className="absolute top-3.5 left-0 flex h-[29px] w-20 items-center bg-primary pl-[15px] text-sm font-bold text-primary-foreground max-lg:top-4 max-lg:h-8 max-lg:w-[68px] max-lg:pl-2 max-lg:text-[13px] max-lg:font-medium">
            RARO
          </span>
        )}
        {soldOut && (
          <span className="absolute bottom-5 left-3 rounded bg-background/90 px-2 py-1 text-xs font-bold lg:top-3 lg:right-3 lg:bottom-auto lg:left-auto">
            Esgotado
          </span>
        )}
        <div className="absolute top-3 right-[11px] z-10 flex gap-2 motion-reduce:transition-none lg:top-auto lg:right-auto lg:bottom-4 lg:left-1/2 lg:-translate-x-1/2 lg:opacity-0 lg:transition-opacity lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
          <span className="max-lg:hidden">
            <QuickAddButton nft={nft} />
          </span>
          <FavoriteButton
            nftId={nft.id}
            nftName={nft.name}
            variant="icon"
            className="max-lg:size-7 max-lg:border max-lg:border-border max-lg:bg-muted max-lg:text-highlight max-lg:[&_svg]:size-3.5"
          />
        </div>
      </div>
      <div className="grid max-lg:pl-2 lg:gap-3">
        <h3
          className={cn(
            'truncate text-base leading-4 max-lg:text-[15px] max-lg:leading-5',
            compact && 'lg:text-[15px]',
          )}
        >
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <p
          className={cn(
            'flex flex-wrap items-baseline gap-x-3 text-base leading-4 font-bold text-highlight',
            !compact && 'lg:text-lg',
          )}
        >
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
