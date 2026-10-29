import {
  queryOptions,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { userKey } from '@/features/auth/queries';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import type { Network } from '@/contracts/wallet';
import { ApiRequestError } from '@/lib/api-error';
import {
  connectWallet,
  createQuote,
  disconnectWallet,
  fetchOrder,
  fetchOrders,
  fetchWalletConnection,
  placeOrder,
} from './api';

export const orderKeys = {
  all: (userId: string) => [...userKey(userId), 'orders'] as const,
  detail: (userId: string, orderId: string) => [...orderKeys.all(userId), orderId] as const,
};

export function ordersQueryOptions(userId: string | null) {
  return queryOptions({
    queryKey: orderKeys.all(userId ?? 'anonymous'),
    queryFn: userId ? ({ signal }) => fetchOrders(signal) : skipToken,
  });
}

export function orderQueryOptions(userId: string | null, orderId: string) {
  return queryOptions({
    queryKey: orderKeys.detail(userId ?? 'anonymous', orderId),
    queryFn: userId ? ({ signal }) => fetchOrder(orderId, signal) : skipToken,
  });
}

export const walletConnectionKey = (userId: string) =>
  [...userKey(userId), 'wallet-connection'] as const;

export function walletConnectionQueryOptions(userId: string | null) {
  return queryOptions({
    queryKey: walletConnectionKey(userId ?? 'anonymous'),
    queryFn: userId ? ({ signal }) => fetchWalletConnection(signal) : skipToken,
  });
}

export function useWalletConnection() {
  return useQuery(walletConnectionQueryOptions(useCurrentUserId()));
}

export function useIsWalletConnected(walletId: string, network: Network) {
  const { data: connection } = useWalletConnection();
  return connection?.walletId === walletId && connection.network === network;
}

export function useConnectWallet() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn: connectWallet,
    onSuccess: (connection) => {
      if (userId) queryClient.setQueryData(walletConnectionKey(userId), connection);
    },
  });
}

export function useDisconnectWallet() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn: disconnectWallet,
    onSuccess: () => {
      if (userId) queryClient.setQueryData(walletConnectionKey(userId), null);
    },
  });
}

export function useCreateQuote() {
  return useMutation({ mutationFn: createQuote });
}

const MAX_ORDER_RETRIES = 2;

/** Safe to retry automatically: the idempotency key makes the server return the same order. */
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn: placeOrder,
    retry: (failureCount, error) =>
      failureCount < MAX_ORDER_RETRIES && error instanceof ApiRequestError && error.isTransient,
    onSuccess: (order) => {
      if (!userId) return;
      queryClient.setQueryData(orderKeys.detail(userId, order.id), order);
      void queryClient.invalidateQueries({ queryKey: orderKeys.all(userId), exact: true });
    },
  });
}
