import { createFileRoute, Link } from '@tanstack/react-router';
import { EmptyState, ErrorState } from '@/components/query-states';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { exceedsAvailability } from '@/features/cart/cart-lines';
import { CartLineItem } from '@/features/cart/components/cart-line-item';
import { CouponForm } from '@/features/cart/components/coupon-form';
import { PriceSummary, PriceSummarySkeleton } from '@/features/cart/components/price-summary';
import { useCart } from '@/features/cart/queries';

export const Route = createFileRoute('/cart')({
  staticData: { hideMobileTabBar: true },
  head: () => ({ meta: [{ title: 'Cart · NFT Marketplace' }] }),
  component: CartPage,
});

function CartPage() {
  const { data: cart, error, isPending, isFetching, refetch } = useCart();

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold sm:text-5xl">Your cart</h1>
      {error && !cart ? (
        <ErrorState title="Could not load your cart" error={error} onRetry={() => void refetch()} />
      ) : cart?.lines.length === 0 ? (
        <EmptyState title="Your cart is empty">
          <Link to="/" className="text-primary underline">
            Browse the marketplace
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
          <section aria-labelledby="cart-items-heading" className="grid content-start gap-4">
            <h2 id="cart-items-heading" className="sr-only">
              Items
            </h2>
            {isPending ? (
              <div aria-busy="true" className="grid gap-4">
                <span className="sr-only" role="status">
                  Loading your cart
                </span>
                {[1, 2].map((row) => (
                  <Skeleton key={row} className="h-32 w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <ul className="grid gap-4">
                {cart.lines.map((line) => (
                  <CartLineItem key={`${line.nftId}:${line.editionId}`} line={line} />
                ))}
              </ul>
            )}
          </section>
          <aside
            aria-labelledby="summary-heading"
            aria-busy={isFetching}
            className="grid content-start gap-6 rounded-2xl bg-card p-6"
          >
            <h2 id="summary-heading" className="text-xl font-semibold">
              Order summary
            </h2>
            {isPending ? (
              <PriceSummarySkeleton />
            ) : (
              <>
                <CouponForm coupon={cart.summary.coupon} />
                <PriceSummary summary={cart.summary} feeLabel="Estimated network fee" />
                <CheckoutButton blocked={cart.lines.some(exceedsAvailability)} />
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

function CheckoutButton({ blocked }: { blocked: boolean }) {
  if (blocked) {
    return (
      <div className="grid gap-2">
        <Button size="lg" disabled>
          Checkout
        </Button>
        <p className="text-sm text-muted-foreground">
          Adjust the items that are no longer available to continue.
        </p>
      </div>
    );
  }
  return (
    <Button asChild size="lg">
      <Link to="/checkout">Checkout</Link>
    </Button>
  );
}
