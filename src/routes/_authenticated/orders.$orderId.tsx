import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { EmptyState, ErrorState } from '@/components/query-states';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import { OrderStatus } from '@/features/checkout/components/order-status';
import { orderQueryOptions } from '@/features/checkout/queries';
import { hasErrorCode } from '@/lib/api-error';

export const Route = createFileRoute('/_authenticated/orders/$orderId')({
  head: () => ({ meta: [{ title: 'Pedido · Kurio' }] }),
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const { data, error, isPending, refetch } = useQuery(
    orderQueryOptions(useCurrentUserId(), orderId),
  );

  return (
    <div className="page-container grid grid-cols-1 gap-8 py-10 lg:py-16">
      {isPending ? (
        <Skeleton className="mx-auto h-[600px] w-full max-w-[578px]" />
      ) : hasErrorCode(error, 'NOT_FOUND', 'FORBIDDEN') ? (
        <EmptyState title="Pedido não encontrado">
          <Link to="/" hash="mercado" className="text-highlight underline">
            Explorar o mercado
          </Link>
        </EmptyState>
      ) : error ? (
        <ErrorState
          title="Não foi possível carregar este pedido"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : (
        <OrderStatus order={data} />
      )}
    </div>
  );
}
