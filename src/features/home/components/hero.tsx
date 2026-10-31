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
    <div role="group" aria-label="Destaques" className={cn('flex', className)}>
      {slides.map((nft, index) => (
        <button
          key={nft.id}
          type="button"
          aria-label={`Mostrar ${nft.name}`}
          aria-current={index === current}
          onClick={() => {
            onSelect(index);
          }}
          className="grid h-6 w-4 place-items-center"
        >
          <span
            className={cn(
              'size-2 rounded-full bg-primary transition-opacity motion-reduce:transition-none',
              index !== current && 'opacity-60',
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
  const next = featured.at((current + 1) % Math.max(featured.length, 1));

  return (
    <section aria-label="Destaques">
      <div className="hidden grid-cols-[minmax(0,600px)_minmax(0,450px)] justify-between gap-10 pl-10 lg:grid">
        <div className="grid content-center gap-11">
          <div className="grid gap-8">
            <div className="grid gap-1">
              <p className="text-sm font-medium tracking-[0.1em]">Bem-vindo à Kurio</p>
              <h1 className="text-[43px] leading-[70px] font-bold whitespace-pre-line">
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
              className="flex h-10 w-fit items-center rounded-md bg-primary px-8 text-base font-bold text-primary-foreground hover:bg-primary/90"
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
        <HeroArtwork nft={nft} className="block aspect-square w-full rounded-3xl" />
      </div>

      <div className="relative overflow-hidden rounded-[30px] bg-linear-to-br from-primary/20 to-primary/10 px-4 pt-[5px] pb-1.5 lg:hidden">
        <span
          aria-hidden="true"
          className="absolute -top-[31px] -left-20 size-62 rounded-full bg-linear-to-br from-[#dd9a5f]/43 to-primary/4"
        />
        <span
          aria-hidden="true"
          className="absolute -top-2.5 left-[73px] size-62 rounded-full bg-linear-to-br from-[#dd9a5f]/37 to-primary/0"
        />
        <div className="relative flex gap-2">
          <div className="grid min-w-0 flex-[0_1_188px] content-start">
            <div className="grid gap-1.5">
              <p className="text-xs leading-4 font-medium">Bem-vindo à Kurio</p>
              <h1 className="text-lg leading-[29px] font-bold whitespace-pre-line">
                {'SEJA DONO DA\nCULTURA DIGITAL'}
              </h1>
              <p className="text-xs leading-[18px] text-muted-foreground">
                Descubra NFTs selecionados de criadores do mundo todo.
              </p>
            </div>
            <Link
              to="/"
              hash="mercado"
              className="flex h-4 items-center gap-2 text-xs font-bold text-highlight"
            >
              EXPLORAR <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="relative mt-1.5 h-[146px] min-w-[104px] flex-1">
            <HeroArtwork
              nft={nft}
              className="absolute top-0 right-0 aspect-square w-full max-w-[138px] rounded-2xl"
            />
            {next && next !== nft && (
              <HeroArtwork
                nft={next}
                className="absolute top-[88px] left-[14px] size-[58px] rounded-2xl"
              />
            )}
          </div>
        </div>
        <SlideDots
          slides={featured}
          current={current}
          onSelect={setCurrent}
          className="relative mt-1 justify-center"
        />
      </div>
    </section>
  );
}
