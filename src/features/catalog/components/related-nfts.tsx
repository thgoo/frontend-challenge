import { useQuery } from '@tanstack/react-query';
import type { Nft } from '@/contracts/nft';
import { nftListQueryOptions } from '../queries';
import { NftCard } from './nft-card';

const RELATED_COUNT = 5;

export function RelatedNfts({ nft }: { nft: Nft }) {
  const { data } = useQuery(
    nftListQueryOptions({ q: nft.collection, view: 'all', sort: 'newest', page: 1 }),
  );
  const related = data?.items.filter((item) => item.id !== nft.id).slice(0, RELATED_COUNT) ?? [];
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="grid gap-8">
      <h2
        id="related-heading"
        className="border-b border-primary/30 pb-3 text-[17px] leading-4 font-bold text-highlight"
      >
        Mais desta coleção
      </h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-7">
        {related.map((item) => (
          <li key={item.id}>
            <NftCard nft={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
