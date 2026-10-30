import type { Nft } from '@/contracts/nft';
import { NftCard, NftCardSkeleton } from './nft-card';

/** Mobile staggers the right column, as in the Figma. */
const GRID =
  'grid grid-cols-2 gap-x-4 gap-y-6 pb-8 sm:grid-cols-3 lg:gap-x-8 lg:gap-y-[72px] lg:pb-0 max-sm:[&>*:nth-child(even)]:translate-y-8';

/** The first row is above the fold on most screens, so it loads eagerly for LCP. */
const EAGER_COUNT = 3;

export function NftGrid({ nfts, eager = false }: { nfts: readonly Nft[]; eager?: boolean }) {
  return (
    <ul className={GRID}>
      {nfts.map((nft, index) => (
        <li key={nft.id}>
          <NftCard nft={nft} priority={eager && index < EAGER_COUNT} />
        </li>
      ))}
    </ul>
  );
}

export function NftGridSkeleton({ count }: { count: number }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }, (_, index) => (
        <NftCardSkeleton key={index} />
      ))}
    </div>
  );
}
