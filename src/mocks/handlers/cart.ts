import { http, HttpResponse } from 'msw';
import { cartItemInputSchema, cartQuantityInputSchema } from '@/contracts/cart';
import { couponInputSchema } from '@/contracts/pricing';
import { readDb, transaction } from '../db/store';
import type { CartRecord, UserRecord } from '../db/types';
import {
  applyCoupon,
  guestCart,
  removeCoupon,
  removeItem,
  setItemQuantity,
  toCartDto,
  userCart,
} from '../domain/carts';
import { ok, type Result } from '../domain/result';
import type { Tx } from '../domain/tx';
import { apiPath } from '../http/api';
import { GUEST_CART_COOKIE, guestCartCookie } from '../http/cookies';
import { failureResponse, readJson, validationError } from '../http/responses';
import { currentUser } from '../http/session';

type Cookies = Record<string, string>;
type ItemParams = { nftId: string; editionId: string };

function resolveCart(tx: Tx, user: UserRecord | null, cookies: Cookies): CartRecord {
  return user ? userCart(tx, user.id) : guestCart(tx, cookies[GUEST_CART_COOKIE]);
}

function cartResponse(cart: CartRecord, cookies: Cookies) {
  const isNewGuestCart = cart.userId === null && cookies[GUEST_CART_COOKIE] !== cart.id;
  const headers: HeadersInit = isNewGuestCart ? { 'Set-Cookie': guestCartCookie(cart.id) } : {};
  return HttpResponse.json(toCartDto(readDb(), cart, Date.now()), { headers });
}

function withCart(cookies: Cookies, change: (tx: Tx, cart: CartRecord) => Result<CartRecord>) {
  const user = currentUser(cookies);
  const result = transaction((tx) => change(tx, resolveCart(tx, user, cookies)));
  return result.ok ? cartResponse(result.value, cookies) : failureResponse(result);
}

export const cartHandlers = [
  http.get(apiPath('/cart'), ({ cookies }) => withCart(cookies, (_tx, cart) => ok(cart))),

  http.post(apiPath('/cart/items'), async ({ request, cookies }) => {
    const input = await readJson(request, cartItemInputSchema);
    if (!input.success) return validationError(input.error);
    return withCart(cookies, (tx, cart) => setItemQuantity(tx.db, cart, input.data, 'add'));
  }),

  http.patch<ItemParams>(
    apiPath('/cart/items/:nftId/:editionId'),
    async ({ request, params, cookies }) => {
      const input = await readJson(request, cartQuantityInputSchema);
      if (!input.success) return validationError(input.error);
      return withCart(cookies, (tx, cart) =>
        setItemQuantity(tx.db, cart, { ...params, ...input.data }, 'replace'),
      );
    },
  ),

  http.delete<ItemParams>(apiPath('/cart/items/:nftId/:editionId'), ({ params, cookies }) =>
    withCart(cookies, (_tx, cart) => {
      removeItem(cart, params);
      return ok(cart);
    }),
  ),

  http.put(apiPath('/cart/coupon'), async ({ request, cookies }) => {
    const input = await readJson(request, couponInputSchema);
    if (!input.success) return validationError(input.error);
    return withCart(cookies, (tx, cart) => applyCoupon(tx.db, cart, input.data.code, tx.now));
  }),

  http.delete(apiPath('/cart/coupon'), ({ cookies }) =>
    withCart(cookies, (_tx, cart) => {
      removeCoupon(cart);
      return ok(cart);
    }),
  ),
];
