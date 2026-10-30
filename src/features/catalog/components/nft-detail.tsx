import { Link } from '@tanstack/react-router';
import { Star } from 'lucide-react';
import { Tabs } from 'radix-ui';
import { useRef, useState } from 'react';
import { EthAmount } from '@/components/eth-amount';
import { BackButton } from '@/components/layout/mobile-page-header';
import { QuantityStepper } from '@/components/quantity-stepper';
import { RatingStars } from '@/components/rating-stars';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Edition, Nft } from '@/contracts/nft';
import {
  AddToCartIconButton,
  EditionPicker,
  PurchaseLimitNotice,
} from '@/features/cart/components/purchase-controls';
import {
  selectedPrice,
  usePurchaseActions,
  usePurchaseSelection,
} from '@/features/cart/use-purchase';
import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import { formatRating } from '@/i18n/locale';
import { formatEth } from '@/lib/eth';
import { NETWORK_LABELS } from '@/lib/networks';
import { shortenAddress } from '@/lib/wallets';
import { NftGallery } from './nft-gallery';
import { NftReviews } from './nft-reviews';
import { NftShelf } from './nft-shelf';
import { ShareLinks } from './share-links';

type DetailTab = 'details' | 'reviews';

const TAB_TRIGGER =
  'border-b-2 border-transparent pb-2 text-[17px] data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:text-highlight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

function DetailsText({ nft, edition }: { nft: Nft; edition: Edition | undefined }) {
  const network = NETWORK_LABELS[nft.network];
  const royalty = `${String(nft.royaltyBasisPoints / 100)}%`;
  return (
    <div className="grid gap-3 text-sm leading-6 text-muted-foreground">
      <p>
        {nft.name} é uma obra digital {edition?.name ?? ''} finalizada à mão da coleção{' '}
        {nft.collection}. Cada atributo fica armazenado nos metadados do token e verificado na{' '}
        {network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.
      </p>
      <p>
        A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e
        um registro permanente de procedência na rede. {nft.creator.name} recebe {royalty} de
        direitos autorais nas vendas secundárias, apoiando novos trabalhos da comunidade.
      </p>
      <dl className="grid gap-3">
        <div>
          <dt className="font-bold text-foreground">Rede:</dt>
          <dd>Cunhado na {network} com procedência imutável e metadados armazenados no IPFS.</dd>
        </div>
        <div>
          <dt className="font-bold text-foreground">Direitos autorais:</dt>
          <dd>
            Direitos autorais do criador: {royalty} nas vendas secundárias, pagos automaticamente
            pelos mercados compatíveis.
          </dd>
        </div>
        <div>
          <dt className="font-bold text-foreground">Contrato:</dt>
          <dd>
            <span className="font-mono">{shortenAddress(nft.contractAddress)}</span> • Contrato
            inteligente ERC-721 verificado.
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function NftDetail({ nft }: { nft: Nft }) {
  const selection = usePurchaseSelection(nft);
  const actions = usePurchaseActions(nft, selection);
  const [tab, setTab] = useState<DetailTab>('details');
  const tabsRef = useRef<HTMLDivElement>(null);
  const { edition } = selection;
  const reviewsLabel = `${String(nft.rating.count)} avaliações de colecionadores`;

  const showReviews = () => {
    setTab('reviews');
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <article className="page-container grid gap-16 pt-6 pb-56 lg:gap-24 lg:pt-8 lg:pb-0">
      <title>{`${nft.name} · Kurio`}</title>
      <div className="grid gap-3">
        <nav aria-label="Trilha" className="hidden text-[15px] font-bold lg:block">
          <ol className="flex gap-2">
            <li>
              <Link to="/" className="hover:text-highlight">
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/" hash="mercado" className="hover:text-highlight">
                Mercado
              </Link>
            </li>
          </ol>
        </nav>
        <div className="grid gap-6 lg:grid-cols-[573px_minmax(0,1fr)] lg:gap-8">
          <div className="relative">
            <div className="absolute inset-x-3 top-3 z-10 flex justify-between lg:hidden">
              <BackButton />
              <FavoriteButton nftId={nft.id} nftName={nft.name} variant="icon" />
            </div>
            <NftGallery nft={nft} />
          </div>

          <div className="grid content-start gap-5">
            <header className="grid gap-3 border-b border-primary/30 pb-3">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold lg:text-[28px]">{nft.name}</h1>
                <button
                  type="button"
                  onClick={showReviews}
                  aria-label={`Avaliação ${formatRating(nft.rating.average)} de 5, ${reviewsLabel}`}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-0.5 text-sm font-medium lg:hidden"
                >
                  <Star aria-hidden="true" className="size-3.5 fill-highlight text-highlight" />
                  {formatRating(nft.rating.average)}
                  <span className="font-normal">({nft.rating.count})</span>
                </button>
              </div>
              <div className="hidden items-center justify-between gap-4 lg:flex">
                {edition && (
                  <p className="flex items-baseline gap-3 text-[22px] font-bold text-highlight">
                    <EthAmount value={edition.priceEth} />
                    {edition.compareAtPriceEth && (
                      <s className="text-lg font-normal text-subtle">
                        <span className="sr-only">Preço anterior: </span>
                        <EthAmount value={edition.compareAtPriceEth} />
                      </s>
                    )}
                  </p>
                )}
                <button
                  type="button"
                  onClick={showReviews}
                  className="flex items-center gap-2 text-[15px] hover:text-highlight"
                >
                  <RatingStars value={nft.rating.average} />
                  {reviewsLabel}
                </button>
              </div>
            </header>

            <section className="grid gap-3">
              <h2 className="text-[15px] font-bold">Sobre este NFT:</h2>
              <p className="text-sm leading-6 text-muted-foreground">{nft.description}</p>
            </section>

            <EditionPicker nft={nft} selection={selection} />

            <div className="hidden flex-wrap items-center justify-between gap-4 lg:flex">
              <QuantityStepper
                label="Quantidade"
                value={selection.quantity}
                max={Math.max(selection.remaining, 1)}
                disabled={selection.remaining === 0}
                onChange={selection.setQuantity}
              />
              <div className="flex gap-2">
                <Button
                  disabled={actions.disabled}
                  onClick={actions.buy}
                  className="h-9 w-[115px] text-sm font-bold"
                >
                  {actions.pending ? 'Comprando…' : 'COMPRAR'}
                </Button>
                <FavoriteButton nftId={nft.id} nftName={nft.name} className="h-9" />
              </div>
            </div>
            <PurchaseLimitNotice selection={selection} />

            <dl className="grid gap-3 text-[15px] text-muted-foreground">
              <div className="flex gap-1">
                <dt>ID do token:</dt>
                <dd>{nft.tokenId}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Coleção:</dt>
                <dd>{nft.collection}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Atributos:</dt>
                <dd>{[...nft.tags, ...(nft.rare ? ['Raro'] : [])].join(', ')}</dd>
              </div>
            </dl>
            <div className="hidden lg:block">
              <ShareLinks title={nft.name} />
            </div>
          </div>
        </div>
      </div>

      <div ref={tabsRef} className="scroll-mt-6">
        <Tabs.Root
          value={tab}
          onValueChange={(value) => {
            setTab(value === 'reviews' ? 'reviews' : 'details');
          }}
          className="grid gap-4"
        >
          <Tabs.List
            aria-label="Informações do NFT"
            className="flex gap-8 border-b border-primary/30"
          >
            <Tabs.Trigger value="details" className={TAB_TRIGGER}>
              Detalhes do NFT
            </Tabs.Trigger>
            <Tabs.Trigger value="reviews" className={TAB_TRIGGER}>
              Avaliações de colecionadores ({nft.rating.count})
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="details">
            <DetailsText nft={nft} edition={edition} />
          </Tabs.Content>
          <Tabs.Content value="reviews">
            <NftReviews nftId={nft.id} />
          </Tabs.Content>
        </Tabs.Root>
      </div>

      <NftShelf title="Mais desta coleção" query={{ q: nft.collection }} excludeIds={[nft.id]} />

      <div className="fixed inset-x-0 bottom-0 z-40 grid gap-4 rounded-t-[32px] bg-card px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-medium">Qtd.</span>
            <QuantityStepper
              label="Quantidade"
              value={selection.quantity}
              max={Math.max(selection.remaining, 1)}
              disabled={selection.remaining === 0}
              onChange={selection.setQuantity}
            />
          </div>
          <p className="text-xl font-bold text-highlight">
            <EthAmount value={formatEth(selectedPrice(selection))} />
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            disabled={actions.disabled}
            onClick={actions.buy}
            className="h-[60px] flex-1 rounded-full bg-linear-to-r from-primary to-primary/70 text-base font-bold"
          >
            {actions.pending ? 'Comprando…' : 'Comprar NFT'}
          </Button>
          <AddToCartIconButton actions={actions} />
        </div>
      </div>
    </article>
  );
}

export function NftDetailSkeleton() {
  return (
    <div className="page-container grid gap-8 pt-8 lg:grid-cols-[573px_1fr]" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando NFT
      </span>
      <Skeleton className="aspect-square w-full rounded-3xl" />
      <div className="grid content-start gap-5">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function NftNotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <title>NFT não encontrado · Kurio</title>
      <h1 className="text-[28px] font-bold">NFT não encontrado</h1>
      <p className="text-muted-foreground">Este NFT não existe ou foi removido.</p>
      <Link to="/" hash="mercado" className="text-highlight underline underline-offset-4">
        Explorar o mercado
      </Link>
    </section>
  );
}
