import { Link } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Nft } from '@/contracts/nft';
import { PurchasePanel } from '@/features/cart/components/purchase-panel';
import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import { CATEGORY_LABELS } from '../category-labels';
import { NftGallery } from './nft-gallery';

const LAYOUT = 'mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2';

export function NftDetail({ nft }: { nft: Nft }) {
  return (
    <article className={LAYOUT}>
      <title>{`${nft.name} · NFT Marketplace`}</title>
      <NftGallery images={nft.images} />
      <div className="grid content-start gap-6">
        <header className="grid gap-3">
          <Badge variant="secondary">{CATEGORY_LABELS[nft.category]}</Badge>
          <h1 className="text-3xl font-semibold sm:text-5xl">{nft.name}</h1>
          <p className="text-muted-foreground">
            Created by <span className="font-medium text-foreground">{nft.creator.name}</span>
          </p>
        </header>
        <p>{nft.description}</p>
        {nft.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Tags">
            {nft.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="outline">#{tag}</Badge>
              </li>
            ))}
          </ul>
        )}
        <FavoriteButton nftId={nft.id} nftName={nft.name} />
        <PurchasePanel nft={nft} />
      </div>
    </article>
  );
}

export function NftDetailSkeleton() {
  return (
    <div className={LAYOUT} aria-busy="true">
      <span className="sr-only" role="status">
        Loading NFT
      </span>
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="grid content-start gap-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-14 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function NftNotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <title>NFT not found · NFT Marketplace</title>
      <h1 className="text-3xl font-semibold">NFT not found</h1>
      <p className="text-muted-foreground">This NFT does not exist or was removed.</p>
      <Link to="/" className="text-primary underline underline-offset-4">
        Browse the marketplace
      </Link>
    </section>
  );
}
