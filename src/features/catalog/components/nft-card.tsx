import { Link } from '@tanstack/react-router';
import { EthAmount } from '@/components/eth-amount';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Nft } from '@/contracts/nft';
import { formatEth } from '@/lib/eth';
import { isAvailable, lowestPrice } from '@/lib/nft';

export function NftCard({ nft }: { nft: Nft }) {
  const [cover] = nft.images;
  return (
    <article className="group relative overflow-hidden rounded-2xl bg-card">
      <div className="aspect-square overflow-hidden">
        {cover && (
          <img
            src={cover.url}
            alt={cover.alt}
            width={400}
            height={400}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform group-hover:scale-105 motion-reduce:transition-none"
          />
        )}
      </div>
      <div className="grid gap-3 p-5">
        <h3 className="truncate text-lg font-semibold">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">by {nft.creator.name}</p>
        <div className="flex items-end justify-between gap-2">
          <div className="grid">
            <span className="text-xs text-muted-foreground">From</span>
            <EthAmount value={formatEth(lowestPrice(nft))} className="font-mono" />
          </div>
          {!isAvailable(nft) && <Badge variant="secondary">Sold out</Badge>}
        </div>
      </div>
    </article>
  );
}

export function NftCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card">
      <Skeleton className="aspect-square rounded-none" />
      <div className="grid gap-3 p-5">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    </div>
  );
}
