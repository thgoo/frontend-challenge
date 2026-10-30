import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Field, FormField } from '@/components/form-field';
import { EmptyState, ErrorState } from '@/components/query-states';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { Cart } from '@/contracts/cart';
import { networkSchema, type Wallet } from '@/contracts/wallet';
import { useWallets } from '@/features/account/queries';
import { useSession } from '@/features/auth/queries';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import { CouponForm } from '@/features/cart/components/coupon-form';
import { PriceSummary, PriceSummarySkeleton } from '@/features/cart/components/price-summary';
import { cartKey, useCart } from '@/features/cart/queries';
import { errorMessage } from '@/i18n/api-errors';
import { hasErrorCode } from '@/lib/api-error';
import { NETWORK_LABELS } from '@/lib/networks';
import { checkoutDetailsSchema, checkoutDraft, type CheckoutDetails } from '../checkout-details';
import {
  ordersQueryOptions,
  quoteQueryOptions,
  useConnectWallet,
  useIsWalletConnected,
  usePlaceOrder,
} from '../queries';
import { isQuoteStale } from '../quote-freshness';
import { useIdempotencyKey } from '../use-idempotency-key';
import { QuoteLines } from './quote-lines';
import { WalletPicker } from './wallet-picker';

interface Notice {
  message: string;
  linkToCart?: boolean;
}

function noticeFor(error: unknown): Notice {
  return {
    message: errorMessage(error),
    linkToCart: hasErrorCode(error, 'AVAILABILITY_CONFLICT', 'COUPON_EXPIRED', 'COUPON_INVALID'),
  };
}

const CONFIRM_BUTTON =
  'h-[60px] w-full rounded-full bg-linear-to-r from-primary to-primary/70 text-base font-bold lg:h-[45px] lg:rounded-md lg:bg-primary lg:bg-none';

interface CheckoutFormProps {
  cart: Cart;
  wallets: readonly Wallet[];
  /** Owned by the page: the form may unmount (cart emptied by settlement) while the order is in flight. */
  placeOrder: ReturnType<typeof usePlaceOrder>;
}

function CheckoutForm({ cart, wallets, placeOrder }: CheckoutFormProps) {
  const session = useSession();
  const userId = useCurrentUserId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const primary = wallets.find((wallet) => wallet.role === 'primary') ?? wallets[0];
  const { register, handleSubmit, control, formState } = useForm<CheckoutDetails>({
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
  const { errors } = formState;
  const values = useWatch({ control });
  const [walletId, network] = useWatch({ control, name: ['walletId', 'network'] });
  useEffect(() => {
    checkoutDraft.write(values);
  }, [values]);

  const quote = useQuery(quoteQueryOptions(userId, network));
  const idempotencyKey = useIdempotencyKey(quote.data?.id);
  const connect = useConnectWallet();
  const connected = useIsWalletConnected(walletId, network);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showCoupon, setShowCoupon] = useState(false);

  const stale = quote.data ? isQuoteStale(quote.data, cart) : false;
  const placing = connect.isPending || placeOrder.isPending;
  const selectedWallet = wallets.find((wallet) => wallet.id === walletId);

  /** Both at once, so the quote is marked as fetching (and confirmation blocked) right away. */
  const refreshQuote = () =>
    Promise.all([queryClient.invalidateQueries({ queryKey: cartKey(userId) }), quote.refetch()]);

  const submit = handleSubmit(async ({ walletId: wallet, network: chain, ...buyer }) => {
    if (!quote.data || quote.isFetching || stale) return;
    setNotice(null);
    if (!connected) {
      try {
        await connect.mutateAsync({ walletId: wallet, network: chain });
      } catch (error) {
        setNotice(noticeFor(error));
        return;
      }
    }
    placeOrder.mutate(
      {
        input: {
          quoteId: quote.data.id,
          walletId: wallet,
          network: chain,
          buyer: { ...buyer, note: buyer.note || undefined },
        },
        idempotencyKey,
      },
      {
        onSuccess: (order) => {
          checkoutDraft.clear();
          void navigate({ to: '/orders/$orderId', params: { orderId: order.id } });
        },
        onError: (error) => {
          if (hasErrorCode(error, 'QUOTE_OUTDATED')) {
            void refreshQuote();
            setNotice({
              message:
                'Preços ou disponibilidade mudaram. Revise o novo total e confirme novamente.',
            });
            return;
          }
          setNotice(noticeFor(error));
        },
      },
    );
  });

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_405px] lg:gap-x-8 lg:gap-y-6"
    >
      <section
        aria-labelledby="collector-heading"
        className="order-2 grid content-start gap-4 lg:order-none lg:col-start-1 lg:row-span-3 lg:row-start-1"
      >
        <h2 id="collector-heading" className="text-[17px] font-bold">
          Perfil do colecionador
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-6">
          <FormField
            label="Nome de exibição"
            required
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Field label="Nome de usuário">
            {(control) => (
              <Input {...control} readOnly value={session ? `@${session.user.username}` : ''} />
            )}
          </Field>
          <Controller
            control={control}
            name="network"
            render={({ field }) => (
              <Field label="Rede" required>
                {(fieldControl) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(networkSchema.parse(value));
                    }}
                  >
                    <SelectTrigger
                      {...fieldControl}
                      className="h-10 w-full rounded-sm border-primary/40"
                    >
                      <SelectValue placeholder="Selecione uma rede" />
                    </SelectTrigger>
                    <SelectContent>
                      {networkSchema.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {NETWORK_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
            )}
          />
          <FormField
            label="E-mail"
            required
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Field label="Endereço da carteira">
            {(control) => (
              <Input
                {...control}
                readOnly
                value={selectedWallet?.address ?? ''}
                className="font-mono"
              />
            )}
          </Field>
          <div className="sm:col-span-2 sm:max-w-[350px]">
            <Field label="Observação do colecionador (opcional)" error={errors.note?.message}>
              {(control) => <Textarea {...control} rows={5} {...register('note')} />}
            </Field>
          </div>
        </div>
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
              <PriceSummary summary={quote.data} />
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
              error={errors.walletId?.message}
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
