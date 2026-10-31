import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { NftImage } from '@/components/nft-image';
import type { NftListQuery } from '@/contracts/nft';
import { artworkImage } from '@/lib/artwork';

const PROMOS = [
  {
    title: 'Lançamentos gênesis\nde edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    artwork: 'emerald',
    search: { view: 'new' },
  },
  {
    title: 'Arte digital selecionada\ne muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    artwork: 'baron',
    search: { categories: ['digital-art'] },
  },
] as const satisfies readonly {
  title: string;
  text: string;
  artwork: Parameters<typeof artworkImage>[0];
  search: Partial<NftListQuery>;
}[];

export function Promos() {
  return (
    <section id="criadores" aria-label="Coleções em destaque" className="grid gap-7 lg:grid-cols-2">
      {PROMOS.map((promo) => (
        <article
          key={promo.title}
          className="relative grid overflow-hidden rounded-lg bg-card sm:h-[250px] sm:grid-cols-[292px_minmax(0,1fr)]"
        >
          <NftImage
            image={artworkImage(promo.artwork)}
            alt=""
            sizes="(min-width: 1024px) 292px, 50vw"
            className="h-48 w-full rounded-[18px] sm:h-full"
          />
          {/* Decorative arcs from the Figma, clipped by the card. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-[142px] -left-[191px] size-64 rounded-full border-2 border-primary max-sm:hidden"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-[134px] -left-[199px] size-64 rounded-full border border-primary max-sm:hidden"
          />
          <div className="flex flex-col gap-2 p-6 sm:items-end sm:pt-[37px] sm:pr-[30px] sm:pb-[46px] sm:pl-0 sm:text-right">
            <h3 className="text-lg leading-6 font-bold whitespace-pre-line">{promo.title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{promo.text}</p>
            <Link
              to="/"
              search={promo.search}
              hash="mercado"
              className="mt-auto flex h-10 w-[140px] items-center justify-center gap-0.5 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Explorar <ArrowRight aria-hidden="true" className="size-[18px]" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
