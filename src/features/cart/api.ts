import { cartSchema, type CartItemInput, type CartItemKey } from '@/contracts/cart';
import { request } from '@/lib/http';

const itemUrl = ({ nftId, editionId }: CartItemKey) =>
  `/cart/items/${encodeURIComponent(nftId)}/${encodeURIComponent(editionId)}`;

export function fetchCart(signal?: AbortSignal) {
  return request(cartSchema, { url: '/cart', signal });
}

export function addCartItem(input: CartItemInput) {
  return request(cartSchema, { method: 'POST', url: '/cart/items', data: input });
}

export function updateCartItem({ quantity, ...key }: CartItemInput) {
  return request(cartSchema, { method: 'PATCH', url: itemUrl(key), data: { quantity } });
}

export function removeCartItem(key: CartItemKey) {
  return request(cartSchema, { method: 'DELETE', url: itemUrl(key) });
}

export function applyCoupon(code: string) {
  return request(cartSchema, { method: 'PUT', url: '/cart/coupon', data: { code } });
}

export function removeCoupon() {
  return request(cartSchema, { method: 'DELETE', url: '/cart/coupon' });
}
