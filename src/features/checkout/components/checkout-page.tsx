import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { EmptyState, ErrorState } from '@/components/query-states';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Cart } from '@/contracts/cart';
import type { Wallet } from '@/contracts/wallet';
import { useWallets } from '@/features/account/queries';
import { useSession } from '@/features/auth/queries';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import { CouponForm } from '@/features/cart/components/coupon-form';
import { PriceSummary, PriceSummarySkeleton } from '@/features/cart/components/price-summary';
import { cartKey, useCart } from '@/features/cart/queries';
import { checkoutDetailsSchema, checkoutDraft, type CheckoutDetails } from '../checkout-details';
import { ordersQueryOptions, quoteQueryOptions, usePlaceOrder } from '../queries';
import { isQuoteStale } from '../quote-freshness';
import { useCheckoutSubmit } from '../use-checkout-submit';
import { CollectorFields } from './collector-fields';
import { QuoteLines } from './quote-lines';
import { WalletPicker } from './wallet-picker';

const CONFIRM_BUTTON =
  'h-[60px] w-full rounded-full bg-linear-to-r from-primary to-primary/70 text-base font-bold lg:h-[45px] lg:rounded-md lg:bg-primary lg:bg-none';

interface CheckoutFormProps {
  cart: Cart;
  wallets: readonly Wallet[];
  placeOrder: ReturnType<typeof usePlaceOrder>;
}

function CheckoutForm({ cart, wallets, placeOrder }: CheckoutFormProps) {
  const session = useSession();
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  const primary = wallets.find((wallet) => wallet.role === 'primary') ?? wallets[0];
  const form = useForm<CheckoutDetails>({
    resolver: zodResolver(checkoutDetailsSchema),
    defaultValues: {
      fullName: session?.user.name ?? '',
      email: session?.user.email ?? '',
      note: '',
      walletId: primary?.id ?? '',
      network: 'ethereum',
      ...checkoutDraft.read(),
    },
  });
  const { control, handleSubmit, formState } = form;
  const values = useWatch({ control });
  const [walletId, network] = useWatch({ control, name: ['walletId', 'network'] });
  useEffect(() => {
    checkoutDraft.write(values);
  }, [values]);

  const quote = useQuery(quoteQueryOptions(userId, network));
  const [showCoupon, setShowCoupon] = useState(false);
  const stale = quote.data ? isQuoteStale(quote.data, cart) : false;

  /** Both at once, so the quote is marked as fetching (and confirmation blocked) right away. */
  const refreshQuote = () =>
    Promise.all([queryClient.invalidateQueries({ queryKey: cartKey(userId) }), quote.refetch()]);

  const { submit, notice, placing } = useCheckoutSubmit({
    quote: quote.data,
    canConfirm: !quote.isFetching && !stale,
    placeOrder,
    onQuoteOutdated: () => void refreshQuote(),
  });

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(submit)(event)}
      className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_405px] lg:gap-x-8 lg:gap-y-6"
    >
      <section
        aria-labelledby="collector-heading"
        className="order-2 grid content-start gap-4 lg:order-none lg:col-start-1 lg:row-span-3 lg:row-start-1"
      >
        <h2 id="collector-heading" className="text-[17px] font-bold">
          Perfil do colecionador
        </h2>
        <CollectorFields
          form={form}
          username={session?.user.username}
          walletAddress={wallets.find((wallet) => wallet.id === walletId)?.address}
        />
      </section>

      <section
        aria-labelledby="your-nfts-heading"
        className="order-3 grid content-start gap-4 lg:order-none lg:col-start-2 lg:row-start-1"
      >
        <h2 id="your-nfts-heading" className="text-[17px] font-bold">
          Seus NFTs
        </h2>
        {quote.error ? (
          <ErrorState
            title="Não foi possível calcular o total"
            error={quote.error}
            onRetry={() => void refreshQuote()}
          />
        ) : !quote.data ? (
          <div aria-busy="true" className="grid gap-3">
            <span className="sr-only" role="status">
              Calculando o total
            </span>
            <Skeleton className="h-16 w-full" />
            <PriceSummarySkeleton />
          </div>
        ) : (
          <>
            <QuoteLines lines={quote.data.lines} />
            {showCoupon ? (
              <CouponForm coupon={cart.summary.coupon} />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowCoupon(true);
                }}
                className="justify-self-center text-[15px] hover:text-highlight"
              >
                Tem um código promocional? Aplique aqui
              </button>
            )}
            {stale && (
              <Alert variant="destructive">
                <AlertTriangle aria-hidden="true" />
                <AlertTitle>Preços ou disponibilidade mudaram</AlertTitle>
                <AlertDescription className="grid gap-3">
                  <p>
                    Este total está desatualizado. Atualize para ver o valor atual antes de
                    confirmar.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={quote.isFetching}
                    onClick={() => void refreshQuote()}
                    className="justify-self-start"
                  >
                    {quote.isFetching ? 'Atualizando…' : 'Atualizar total'}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <div aria-live="polite">
              <PriceSummary summary={quote.data} separateTotal />
            </div>
          </>
        )}
      </section>

      <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-2">
        <Controller
          control={control}
          name="walletId"
          render={({ field }) => (
            <WalletPicker
              wallets={wallets}
              value={field.value}
              onChange={field.onChange}
              error={formState.errors.walletId?.message}
            />
          )}
        />
      </div>

      <div className="order-4 grid gap-3 lg:order-none lg:col-start-2 lg:row-start-3">
        {notice && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {notice.message}{' '}
              {notice.linkToCart && (
                <Link to="/cart" className="underline">
                  Revisar carrinho
                </Link>
              )}
            </AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          disabled={!quote.data || quote.isFetching || stale || placing || wallets.length === 0}
          className={CONFIRM_BUTTON}
        >
          {placing ? 'Confirmando…' : 'Confirmar compra'}
        </Button>
      </div>
    </form>
  );
}

export function CheckoutPage() {
  const userId = useCurrentUserId();
  const cart = useCart();
  const wallets = useWallets();
  const orders = useQuery(ordersQueryOptions(userId));
  const placeOrder = usePlaceOrder();
  const pendingOrder = orders.data?.find((order) => order.status === 'pending');
  /** While an order is in flight, settlement may empty the cart; the form must stay mounted. */
  const finishing = placeOrder.isPending || placeOrder.isSuccess;

  if (pendingOrder && !finishing) {
    return (
      <Alert>
        <AlertTitle>Você tem um pedido em processamento</AlertTitle>
        <AlertDescription>
          Para evitar uma compra duplicada, aguarde a conclusão.{' '}
          <Link
            to="/orders/$orderId"
            params={{ orderId: pendingOrder.id }}
            className="text-highlight underline"
          >
            Acompanhar pedido {pendingOrder.id}
          </Link>
        </AlertDescription>
      </Alert>
    );
  }
  if (cart.error && !cart.data && !finishing) {
    return (
      <ErrorState
        title="Não foi possível carregar seu carrinho"
        error={cart.error}
        onRetry={() => void cart.refetch()}
      />
    );
  }
  if (cart.data?.lines.length === 0 && !finishing) {
    return (
      <EmptyState title="Seu carrinho está vazio">
        <Link to="/" hash="mercado" className="text-highlight underline">
          Explorar o mercado
        </Link>
      </EmptyState>
    );
  }
  if (!cart.data || !wallets.data) {
    return (
      <div aria-busy="true" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_405px] lg:gap-8">
        <span className="sr-only" role="status">
          Carregando pagamento
        </span>
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  return <CheckoutForm cart={cart.data} wallets={wallets.data} placeOrder={placeOrder} />;
}
