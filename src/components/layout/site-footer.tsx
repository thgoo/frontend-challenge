import { Link } from '@tanstack/react-router';
import { NewsletterForm } from '@/features/newsletter/components/newsletter-form';
import { SOCIAL_NETWORKS } from './social-networks';

const HIGHLIGHTS = [
  {
    initial: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    initial: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    initial: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
];

/** Entries without a page in this challenge are plain text instead of links to nowhere. */
const COLUMNS: { title: string; items: { label: string; to?: string }[] }[] = [
  {
    title: 'Meu perfil',
    items: [
      { label: 'Meu perfil', to: '/profile' },
      { label: 'Minha coleção', to: '/favorites' },
      { label: 'Atividade' },
      { label: 'Estúdio do criador' },
      { label: 'Lista de interesse', to: '/favorites' },
    ],
  },
  {
    title: 'Central de ajuda',
    items: [
      { label: 'Central de ajuda' },
      { label: 'Como comprar NFTs' },
      { label: 'Carteira e segurança', to: '/wallets' },
      { label: 'Política do mercado' },
      { label: 'Denunciar item' },
    ],
  },
  {
    title: 'Coleções',
    items: [
      { label: 'Arte digital' },
      { label: 'Fotografia' },
      { label: 'Música' },
      { label: 'Arte 3D' },
      { label: 'Utilidade' },
    ],
  },
];

export function WalletProviders() {
  return (
    <p className="inline-flex rounded-md border border-[#55321f] bg-surface-dark py-1.5 pr-2 pl-2 text-[9px] leading-3 font-bold tracking-[0.1px] whitespace-pre text-highlight">
      {'METAMASK  •  WALLETCONNECT  •  COINBASE'}
    </p>
  );
}

/** Column starts of the Figma footer, shared by the contact band and the link columns. */
const FOOTER_COLUMNS = 'grid grid-cols-[repeat(3,211px)_minmax(0,1fr)] gap-x-[92px]';

/** Desktop only, as in the Figma; mobile screens end with their own action bars. */
export function SiteFooter() {
  return (
    <footer className="page-container hidden pt-24 pb-6 lg:block">
      <div className="grid grid-cols-[repeat(3,266px)_minmax(0,1fr)] bg-card py-8 pr-3.5 pl-8">
        {HIGHLIGHTS.map((item) => (
          <section
            key={item.title}
            className="grid content-start gap-3 border-r border-primary px-4"
          >
            <span
              aria-hidden="true"
              className="grid size-[74px] place-items-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
            >
              {item.initial}
            </span>
            <h2 className="text-[17px] leading-4 font-bold">{item.title}</h2>
            <p className="max-w-[204px] text-sm leading-[22px] text-muted-foreground">
              {item.text}
            </p>
          </section>
        ))}
        <section className="grid content-start gap-3 px-4">
          <h2 className="mb-1 text-lg leading-4 font-bold">Antecipe-se ao próximo lançamento</h2>
          <NewsletterForm />
          <p className="text-[13px] leading-[22px] text-muted-foreground">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </section>
      </div>
      <div
        className={`${FOOTER_COLUMNS} h-[88px] items-center bg-surface-dark px-8 text-sm leading-[22px]`}
      >
        <span className="font-bold tracking-[0.1em]">KURIO</span>
        <p className="whitespace-pre-line">{'Feito para colecionadores,\ncriadores e cultura'}</p>
        <p>contato@email.com</p>
        <p>+55 11 4002 8922</p>
      </div>
      <div className={`${FOOTER_COLUMNS} bg-card p-8`}>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-2 text-lg leading-4 font-bold">{column.title}</h2>
            <ul className="text-sm leading-[30px]">
              {column.items.map((item) => (
                <li key={item.label}>
                  {item.to ? (
                    <Link to={item.to} className="hover:text-highlight">
                      {item.label}
                    </Link>
                  ) : (
                    item.label
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="grid content-start gap-8">
          <div>
            <h2 className="mb-5 text-lg leading-4 font-bold">Redes sociais</h2>
            <ul className="flex gap-2.5" aria-label="Redes sociais">
              {SOCIAL_NETWORKS.map(({ name, viewBox, paths }) => (
                <li
                  key={name}
                  className="grid size-[30px] place-items-center rounded border border-primary text-primary"
                >
                  <svg aria-hidden="true" viewBox={viewBox} className="size-4">
                    {paths.map((path) => (
                      <path
                        key={path.d}
                        d={path.d}
                        fill="currentColor"
                        fillRule={'evenOdd' in path ? 'evenodd' : undefined}
                      />
                    ))}
                  </svg>
                  <span className="sr-only">{name}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-lg leading-4 font-bold">Carteiras compatíveis</h2>
            <WalletProviders />
          </div>
        </div>
      </div>
      <p className="pt-1.5 text-center text-sm leading-[30px]">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  );
}
