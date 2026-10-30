import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { NftImage } from '@/components/nft-image';
import { Skeleton } from '@/components/ui/skeleton';
import type { Nft } from '@/contracts/nft';
import { featuredNftsQueryOptions } from '@/features/catalog/queries';

function SlideDots({
  slides,
  current,
  onSelect,
  className,
}: {
  slides: readonly Nft[];
  current: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  if (slides.length < 2) return null;
  return (
    <div role="group" aria-label="Destaques" className={cn('flex gap-2', className)}>
      {slides.map((nft, index) => (
        <button
          key={nft.id}
          type="button"
          aria-label={`Mostrar ${nft.name}`}
          aria-current={index === current}
          onClick={() => {
            onSelect(index);
          }}
          className="grid size-6 place-items-center"
        >
          <span
            className={cn(
              'size-2 rounded-full bg-primary transition-opacity motion-reduce:transition-none',
              index !== current && 'opacity-40',
            )}
          />
        </button>
      ))}
    </div>
  );
}

function HeroArtwork({ nft, className }: { nft: Nft | undefined; className: string }) {
  if (!nft) return <Skeleton className={className} />;
  return (
    <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className={cn('overflow-hidden', className)}>
      <NftImage
        image={nft.images[0]}
        alt={nft.name}
        sizes="(min-width: 1024px) 450px, 140px"
        priority
        className="size-full"
      />
    </Link>
  );
}

/** Featured pieces rotate on demand only: no autoplay, so nothing moves without the user. */
export function Hero() {
  const { data: featured = [] } = useQuery(featuredNftsQueryOptions);
  const [current, setCurrent] = useState(0);
  const nft = featured[current];

  return (
    <section aria-label="Destaques">
      <div className="hidden grid-cols-[600px_450px] justify-between gap-10 pl-10 lg:grid">
        <div className="grid content-center gap-11">
          <div className="grid gap-8">
            <div className="grid gap-1">
              <p className="text-sm font-medium tracking-[0.1em]">Bem-vindo à Kurio</p>
              <h1 className="text-[43px] leading-[70px] font-bold tracking-wide whitespace-pre-line">
                {'SEJA DONO DO FUTURO\nDA ARTE DIGITAL'}
              </h1>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
                digital rara, apoie artistas e tenha uma parte da cultura da internet.
              </p>
            </div>
            <Link
              to="/"
              hash="mercado"
              className="w-fit rounded-md bg-primary px-9 py-2.5 text-base font-bold text-primary-foreground hover:bg-primary/90"
            >
              EXPLORAR
            </Link>
          </div>
          <SlideDots
            slides={featured}
            current={current}
            onSelect={setCurrent}
            className="justify-self-end"
          />
        </div>
        <HeroArtwork nft={nft} className="size-[450px] rounded-3xl" />
      </div>

      <div className="relative overflow-hidden rounded-[30px] bg-linear-to-br from-surface-dark to-card p-4 lg:hidden">
        <div className="flex gap-2">
          <div className="grid flex-1 content-start gap-2">
            <p className="text-xs font-medium">Bem-vindo à Kurio</p>
            <h1 className="text-lg leading-7 font-bold whitespace-pre-line">
              {'SEJA DONO DA\nCULTURA DIGITAL'}
            </h1>
            <p className="text-xs leading-5 text-muted-foreground">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
            <Link
              to="/"
              hash="mercado"
              className="flex items-center gap-2 text-xs font-bold text-highlight"
            >
              EXPLORAR <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <HeroArtwork nft={nft} className="size-[138px] shrink-0 rounded-2xl" />
        </div>
        <SlideDots
          slides={featured}
          current={current}
          onSelect={setCurrent}
          className="mt-1 justify-center"
        />
      </div>
    </section>
  );
}
