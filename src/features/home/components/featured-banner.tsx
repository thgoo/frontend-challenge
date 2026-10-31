import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { NftImage } from '@/components/nft-image';
import { featuredNftsQueryOptions } from '@/features/catalog/queries';

/** The sidebar spotlight uses the second featured piece, matching the Figma composition. */
export function FeaturedBanner() {
  const { data } = useQuery(featuredNftsQueryOptions);
  const nft = data?.[1] ?? data?.[0];
  if (!nft) return null;

  return (
    <section
      aria-labelledby="spotlight-heading"
      className="grid gap-4 bg-linear-to-b from-surface-dark to-background pt-6"
    >
      <div className="grid gap-4 px-5">
        <h2 id="spotlight-heading" className="text-2xl font-bold text-highlight">
          NFT EM DESTAQUE
        </h2>
        <p className="text-center text-[22px] leading-4 font-bold">OFERTA LIMITADA</p>
      </div>
      <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className="overflow-hidden rounded-[22px]">
        <NftImage image={nft.images[0]} alt={nft.name} sizes="310px" className="h-[368px] w-full" />
      </Link>
    </section>
  );
}
