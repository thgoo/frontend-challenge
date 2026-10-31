import { NftImage } from '@/components/nft-image';
import { artworkImage } from '@/lib/artwork';

/** Editorial content is static in this challenge: there are no article pages to link to. */
const POSTS = [
  {
    meta: '12 de setembro  |  Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    artwork: 'baron',
  },
  {
    meta: '13 de setembro  |  Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
    artwork: 'emerald',
  },
  {
    meta: '15 de setembro  |  Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    artwork: 'sage',
  },
  {
    meta: '15 de setembro  |  Leitura de 2 min',
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
    artwork: 'golden',
  },
] as const;

export function Journal() {
  return (
    <section id="aprenda" aria-labelledby="journal-heading" className="grid gap-10">
      <header className="grid gap-3 text-center">
        <h2 id="journal-heading" className="text-[28px] font-bold">
          Diário da Cunhagem
        </h2>
        <p className="text-sm text-muted-foreground">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {POSTS.map((post) => (
          <li key={post.title}>
            <article className="grid h-full overflow-hidden rounded-lg bg-card">
              <NftImage
                image={artworkImage(post.artwork)}
                alt=""
                sizes="(min-width: 1024px) 268px, (min-width: 640px) 50vw, 100vw"
                className="h-[195px] w-full"
              />
              <div className="grid content-start gap-2 px-4 pt-3 pb-4">
                <p className="text-xs font-medium whitespace-pre text-muted-foreground">
                  {post.meta}
                </p>
                <h3 className="text-base font-bold">{post.title}</h3>
                <p className="text-xs font-medium text-muted-foreground">{post.text}</p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
