import type { Nft } from '@/contracts/nft';
import { NftCard, NftCardSkeleton } from './nft-card';

const GRID = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3';

export function NftGrid({ nfts }: { nfts: readonly Nft[] }) {
  return (
    <ul className={GRID}>
      {nfts.map((nft) => (
        <li key={nft.id}>
          <NftCard nft={nft} />
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
