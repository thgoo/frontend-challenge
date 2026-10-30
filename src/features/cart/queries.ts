import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Cart } from '@/contracts/cart';
import { userKey } from '@/features/auth/queries';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import {
  addCartItem,
  applyCoupon,
  fetchCart,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from './api';

export const cartKey = (userId: string | null) =>
  userId ? ([...userKey(userId), 'cart'] as const) : (['guest', 'cart'] as const);

export function cartQueryOptions(userId: string | null) {
  return queryOptions({
    queryKey: cartKey(userId),
    queryFn: ({ signal }) => fetchCart(signal),
  });
}

export function useCart() {
  return useQuery(cartQueryOptions(useCurrentUserId()));
}

/** Every cart endpoint answers with the whole cart, so the response replaces the cache. */
function useCartMutation<TInput>(mutationFn: (input: TInput) => Promise<Cart>) {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKey(userId), cart);
    },
  });
}

export const useAddCartItem = () => useCartMutation(addCartItem);
export const useUpdateCartItem = () => useCartMutation(updateCartItem);
export const useRemoveCartItem = () => useCartMutation(removeCartItem);
export const useApplyCoupon = () => useCartMutation(applyCoupon);
export const useRemoveCoupon = () => useCartMutation(removeCoupon);

export function useCartItemCount(): number {
  const { data } = useCart();
  return data?.lines.reduce((total, line) => total + line.quantity, 0) ?? 0;
}
