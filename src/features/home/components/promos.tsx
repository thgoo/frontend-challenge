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
          className="grid overflow-hidden rounded-lg bg-card sm:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
        >
          <NftImage
            image={artworkImage(promo.artwork)}
            alt=""
            sizes="(min-width: 1024px) 292px, 50vw"
            className="h-48 w-full rounded-[18px] sm:h-full sm:min-h-48"
          />
          <div className="grid content-center gap-3 p-6 sm:justify-items-end sm:text-right">
            <h3 className="text-lg leading-6 font-bold whitespace-pre-line">{promo.title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{promo.text}</p>
            <Link
              to="/"
              search={promo.search}
              hash="mercado"
              className="mt-2 flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Explorar <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
