import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { EmptyState, ErrorState } from '@/components/query-states';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { Quote } from '@/contracts/quote';
import { useWallets } from '@/features/account/queries';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import { PriceSummary } from '@/features/cart/components/price-summary';
import { useCart } from '@/features/cart/queries';
import { errorMessage } from '@/i18n/api-errors';
import { hasErrorCode } from '@/lib/api-error';
import { checkoutDraft, type CheckoutDetails } from '../checkout-details';
import { ordersQueryOptions, useCreateQuote, usePlaceOrder } from '../queries';
import { isQuoteStale } from '../quote-freshness';
import { DetailsForm } from './details-form';
import { OrderReview } from './order-review';

interface Attempt {
  quote: Quote;
  details: CheckoutDetails;
  /** One key per reviewed quote: retries of the same confirmation can never create a second order. */
  idempotencyKey: string;
}

interface Notice {
  message: string;
  linkToCart?: boolean;
}

function noticeFor(error: unknown): Notice {
  return {
    message: errorMessage(error),
    linkToCart: hasErrorCode(
      error,
      'AVAILABILITY_CONFLICT',
      'COUPON_EXPIRED',
      'COUPON_INVALID',
      'CONFLICT',
    ),
  };
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const userId = useCurrentUserId();
  const cart = useCart();
  const wallets = useWallets();
  const orders = useQuery(ordersQueryOptions(userId));
  const createQuote = useCreateQuote();
  const placeOrder = usePlaceOrder();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const pendingOrder = orders.data?.find((order) => order.status === 'pending');
  const wallet = wallets.data?.find((candidate) => candidate.id === attempt?.details.walletId);

  const requestQuote = (details: CheckoutDetails, successNotice?: string) => {
    setNotice(null);
    createQuote.mutate(details.network, {
      onSuccess: (quote) => {
        setAttempt({ quote, details, idempotencyKey: crypto.randomUUID() });
        if (successNotice) setNotice({ message: successNotice });
      },
      onError: (error) => {
        setNotice(noticeFor(error));
      },
    });
  };

  const confirm = () => {
    if (!attempt) return;
    const { quote, details, idempotencyKey } = attempt;
    const { walletId, network, ...buyer } = details;
    setNotice(null);
    placeOrder.mutate(
      { input: { quoteId: quote.id, walletId, network, buyer }, idempotencyKey },
      {
        onSuccess: (order) => {
          checkoutDraft.clear();
          void navigate({ to: '/orders/$orderId', params: { orderId: order.id } });
        },
        onError: (error) => {
          if (hasErrorCode(error, 'QUOTE_OUTDATED')) {
            requestQuote(
              details,
              'Prices or availability changed. Review the updated total and confirm again.',
            );
            return;
          }
          if (hasErrorCode(error, 'WALLET_DISCONNECTED')) setAttempt(null);
          setNotice(noticeFor(error));
        },
      },
    );
  };

  if (pendingOrder) {
    return (
      <Alert>
        <AlertTitle>You have an order being processed</AlertTitle>
        <AlertDescription>
          To avoid a duplicate purchase, wait for it to finish.{' '}
          <Link
            to="/orders/$orderId"
            params={{ orderId: pendingOrder.id }}
            className="text-primary underline"
          >
            Track order {pendingOrder.id}
          </Link>
        </AlertDescription>
      </Alert>
    );
  }
  if (cart.error && !cart.data) {
    return (
      <ErrorState
        title="Could not load your cart"
        error={cart.error}
        onRetry={() => void cart.refetch()}
      />
    );
  }
  if (cart.data?.lines.length === 0) {
    return (
      <EmptyState title="Your cart is empty">
        <Link to="/" className="text-primary underline">
          Browse the marketplace
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <div className="grid content-start gap-6">
        {notice && (
          <Alert variant="destructive">
            <AlertDescription>
              {notice.message}{' '}
              {notice.linkToCart && (
                <Link to="/cart" className="underline">
                  Review your cart
                </Link>
              )}
            </AlertDescription>
          </Alert>
        )}
        {!wallets.data || !cart.data ? (
          <div aria-busy="true" className="grid gap-4">
            <span className="sr-only" role="status">
              Loading checkout
            </span>
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : attempt ? (
          <OrderReview
            quote={attempt.quote}
            details={attempt.details}
            wallet={wallet}
            stale={isQuoteStale(attempt.quote, cart.data)}
            placing={placeOrder.isPending}
            refreshing={createQuote.isPending}
            onPlaceOrder={confirm}
            onRefreshQuote={() => {
              requestQuote(attempt.details);
            }}
            onEdit={() => {
              setAttempt(null);
            }}
          />
        ) : (
          <DetailsForm
            wallets={wallets.data}
            submitting={createQuote.isPending}
            onSubmit={requestQuote}
          />
        )}
      </div>
      <aside
        aria-labelledby="checkout-summary-heading"
        className="grid content-start gap-4 rounded-2xl bg-card p-6"
      >
        <h2 id="checkout-summary-heading" className="text-xl font-semibold">
          Cart summary
        </h2>
        {cart.data ? (
          <PriceSummary summary={cart.data.summary} estimatedFee />
        ) : (
          <Skeleton className="h-32 w-full" />
        )}
        <p className="text-sm text-muted-foreground">
          The final total is confirmed in the review step.
        </p>
      </aside>
    </div>
  );
}
