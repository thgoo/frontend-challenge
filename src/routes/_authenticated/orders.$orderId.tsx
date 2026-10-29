import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { EmptyState, ErrorState } from '@/components/query-states';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import { OrderStatus } from '@/features/checkout/components/order-status';
import { orderQueryOptions } from '@/features/checkout/queries';
import { hasErrorCode } from '@/lib/api-error';

export const Route = createFileRoute('/_authenticated/orders/$orderId')({
  head: () => ({ meta: [{ title: 'Order · NFT Marketplace' }] }),
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const { data, error, isPending, refetch } = useQuery(
    orderQueryOptions(useCurrentUserId(), orderId),
  );

  return (
    <div className="mx-auto grid max-w-3xl gap-8 px-4 py-10 sm:px-8">
      {isPending ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : hasErrorCode(error, 'NOT_FOUND', 'FORBIDDEN') ? (
        <EmptyState title="Order not found">
          <Link to="/" className="text-primary underline">
            Back to the marketplace
          </Link>
        </EmptyState>
      ) : error ? (
        <ErrorState
          title="Could not load this order"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : (
        <OrderStatus order={data} />
      )}
    </div>
  );
}
