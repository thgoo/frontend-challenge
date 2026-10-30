import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import type { NftListQuery } from '@/contracts/nft';
import { nftListQueryOptions } from '../queries';
import { NftCard } from './nft-card';

const SHELF_SIZE = 5;

interface NftShelfProps {
  title: string;
  query: Partial<NftListQuery>;
  excludeIds?: readonly string[];
}

/** A row of suggestions ("Mais desta coleção", "Colecionadores também viram"). */
export function NftShelf({ title, query, excludeIds = [] }: NftShelfProps) {
  const headingId = useId();
  const { data } = useQuery(
    nftListQueryOptions({ view: 'all', sort: 'newest', page: 1, ...query }),
  );
  const items =
    data?.items.filter((item) => !excludeIds.includes(item.id)).slice(0, SHELF_SIZE) ?? [];
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="grid gap-8">
      <h2
        id={headingId}
        className="border-b border-primary/30 pb-3 text-[17px] leading-4 font-bold text-highlight"
      >
        {title}
      </h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-7">
        {items.map((item) => (
          <li key={item.id}>
            <NftCard nft={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
