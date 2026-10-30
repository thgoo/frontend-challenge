import { createFileRoute, Link } from '@tanstack/react-router';
import { MobilePageHeader } from '@/components/layout/mobile-page-header';
import { EmptyState, ErrorState } from '@/components/query-states';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { exceedsAvailability } from '@/features/cart/cart-lines';
import { CART_COLUMNS, CartLineItem } from '@/features/cart/components/cart-line-item';
import { CouponForm } from '@/features/cart/components/coupon-form';
import { PriceSummary, PriceSummarySkeleton } from '@/features/cart/components/price-summary';
import { useCart } from '@/features/cart/queries';
import { NftShelf } from '@/features/catalog/components/nft-shelf';

export const Route = createFileRoute('/cart')({
  staticData: { hideMobileTabBar: true },
  head: () => ({ meta: [{ title: 'Carrinho · Kurio' }] }),
  component: CartPage,
});

function CartPage() {
  const { data: cart, error, isPending, isFetching, refetch } = useCart();

  return (
    <div className="page-container grid grid-cols-1 gap-16 pt-6 pb-10 lg:gap-24 lg:pt-8 lg:pb-0">
      <div className="grid grid-cols-1 gap-6 lg:gap-3">
        <MobilePageHeader title="Carrinho de NFTs" />
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
            <li aria-hidden="true">/</li>
            <li aria-current="page">Carrinho</li>
          </ol>
        </nav>

        {error && !cart ? (
          <ErrorState
            title="Não foi possível carregar seu carrinho"
            error={error}
            onRetry={() => void refetch()}
          />
        ) : cart?.lines.length === 0 ? (
          <EmptyState title="Seu carrinho está vazio">
            <Link to="/" hash="mercado" className="text-highlight underline">
              Explorar o mercado
            </Link>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-[86px]">
            <section aria-labelledby="cart-items-heading" className="grid content-start gap-3">
              <h2 id="cart-items-heading" className="sr-only">
                Itens
              </h2>
              <div
                aria-hidden="true"
                className={`hidden gap-x-4 border-b border-primary/30 pb-3 text-base font-bold lg:grid ${CART_COLUMNS}`}
              >
                <span className="col-span-2">NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
              </div>
              {isPending ? (
                <div aria-busy="true" className="grid gap-3">
                  <span className="sr-only" role="status">
                    Carregando seu carrinho
                  </span>
                  {[1, 2].map((row) => (
                    <Skeleton key={row} className="h-[100px] w-full rounded-xl lg:h-[70px]" />
                  ))}
                </div>
              ) : (
                <ul className="grid gap-3">
                  {cart.lines.map((line) => (
                    <CartLineItem key={`${line.nftId}:${line.editionId}`} line={line} />
                  ))}
                </ul>
              )}
            </section>
            <aside
              aria-labelledby="summary-heading"
              aria-busy={isFetching}
              className="grid content-start gap-6 rounded-t-[32px] bg-card p-6 lg:rounded-none lg:bg-transparent lg:p-0"
            >
              <h2
                id="summary-heading"
                className="hidden border-b border-primary/30 pb-3 text-lg font-bold lg:block"
              >
                Resumo da carteira
              </h2>
              {isPending ? (
                <PriceSummarySkeleton />
              ) : (
                <>
                  <CouponForm coupon={cart.summary.coupon} />
                  <PriceSummary summary={cart.summary} estimatedFee />
                  <CheckoutAction blocked={cart.lines.some(exceedsAvailability)} />
                </>
              )}
            </aside>
          </div>
        )}
      </div>
      <NftShelf
        title="Colecionadores também viram"
        query={{ view: 'trending' }}
        excludeIds={cart?.lines.map((line) => line.nftId)}
      />
    </div>
  );
}

const CHECKOUT_BUTTON =
  'h-[60px] w-full rounded-full bg-linear-to-r from-primary to-primary/70 text-base font-bold lg:h-10 lg:rounded-md lg:bg-primary lg:bg-none';

function CheckoutAction({ blocked }: { blocked: boolean }) {
  return (
    <div className="grid gap-4 text-center">
      {blocked ? (
        <>
          <Button disabled className={CHECKOUT_BUTTON}>
            Conectar e finalizar
          </Button>
          <p className="text-sm text-muted-foreground">
            Ajuste os itens que não estão mais disponíveis para continuar.
          </p>
        </>
      ) : (
        <Button asChild className={CHECKOUT_BUTTON}>
          <Link to="/checkout">Conectar e finalizar</Link>
        </Button>
      )}
      <Link
        to="/"
        hash="mercado"
        className="hidden text-base text-highlight hover:underline lg:block"
      >
        Continuar explorando
      </Link>
    </div>
  );
}
