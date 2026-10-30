import type { Cart, CartItemInput, CartItemKey, CartLine } from '@/contracts/cart';
import type { Network } from '@/contracts/wallet';
import type { Coupon, PriceSummary } from '@/contracts/pricing';
import type { CartRecord, DbState } from '../db/types';
import { nextId } from './ids';
import { purchasableQuantity } from '@/lib/nft';
import { findEdition } from './inventory';
import { DEFAULT_NETWORK, findCoupon, summarize } from './pricing';
import { fail, ok, type Result } from './result';
import type { Tx } from './tx';

function sameItem(a: CartItemKey, b: CartItemKey) {
  return a.nftId === b.nftId && a.editionId === b.editionId;
}

function createCart(tx: Tx, userId: string | null): CartRecord {
  const cart: CartRecord = {
    id: nextId(tx.db, 'cart'),
    userId,
    items: [],
    couponCode: null,
    version: 0,
  };
  tx.db.carts.push(cart);
  return cart;
}

export function userCart(tx: Tx, userId: string): CartRecord {
  return tx.db.carts.find((cart) => cart.userId === userId) ?? createCart(tx, userId);
}

export function guestCart(tx: Tx, cartId: string | undefined): CartRecord {
  return (
    tx.db.carts.find((cart) => cart.id === cartId && cart.userId === null) ?? createCart(tx, null)
  );
}

function touch(cart: CartRecord) {
  cart.version += 1;
}

export function setItemQuantity(
  db: DbState,
  cart: CartRecord,
  input: CartItemInput,
  mode: 'add' | 'replace',
): Result<CartRecord> {
  const ref = findEdition(db, input);
  if (!ref) return fail(404, 'NOT_FOUND', 'This NFT edition does not exist.');

  const existing = cart.items.find((item) => sameItem(item, input));
  const quantity = mode === 'add' ? (existing?.quantity ?? 0) + input.quantity : input.quantity;
  const limit = purchasableQuantity(ref.edition);
  if (quantity > limit) {
    return fail(409, 'AVAILABILITY_CONFLICT', `Only ${limit} of this edition can be purchased.`, {
      quantity: `Maximum is ${limit}`,
    });
  }

  if (existing) existing.quantity = quantity;
  else cart.items.push({ nftId: input.nftId, editionId: input.editionId, quantity });
  touch(cart);
  return ok(cart);
}

export function removeItem(cart: CartRecord, key: CartItemKey) {
  cart.items = cart.items.filter((item) => !sameItem(item, key));
  touch(cart);
}

export function applyCoupon(
  db: DbState,
  cart: CartRecord,
  code: string,
  now: number,
): Result<CartRecord> {
  const coupon = findCoupon(db, code, now);
  if (!coupon.ok) return coupon;
  cart.couponCode = coupon.value.code;
  touch(cart);
  return ok(cart);
}

export function removeCoupon(cart: CartRecord) {
  cart.couponCode = null;
  touch(cart);
}

export function mergeGuestCart(tx: Tx, guestCartId: string | undefined, userId: string) {
  const guest = tx.db.carts.find((cart) => cart.id === guestCartId && cart.userId === null);
  if (!guest) return;

  const target = userCart(tx, userId);
  for (const item of guest.items) {
    const ref = findEdition(tx.db, item);
    if (!ref) continue;
    const existing = target.items.find((candidate) => sameItem(candidate, item));
    const quantity = Math.min(
      (existing?.quantity ?? 0) + item.quantity,
      purchasableQuantity(ref.edition),
    );
    if (quantity <= 0) continue;
    if (existing) existing.quantity = quantity;
    else target.items.push({ ...item, quantity });
  }
  target.couponCode ??= guest.couponCode;
  touch(target);
  tx.db.carts = tx.db.carts.filter((cart) => cart !== guest);
}

export function removePurchasedItems(cart: CartRecord, purchased: readonly CartItemInput[]) {
  cart.items = cart.items
    .map((item) => {
      const bought = purchased.find((line) => sameItem(line, item))?.quantity ?? 0;
      return { ...item, quantity: item.quantity - bought };
    })
    .filter((item) => item.quantity > 0);
  touch(cart);
}

export function cartLines(db: DbState, cart: CartRecord): CartLine[] {
  return cart.items.flatMap((item) => {
    const ref = findEdition(db, item);
    if (!ref) return [];
    const { nft, edition } = ref;
    return [
      {
        ...item,
        nftName: nft.name,
        editionName: edition.name,
        image: nft.images[0],
        unitPriceEth: edition.priceEth,
        available: edition.available,
        maxPerOrder: edition.maxPerOrder,
      },
    ];
  });
}

export interface PricedCart {
  lines: CartLine[];
  summary: PriceSummary;
}

function resolveCoupon(db: DbState, cart: CartRecord, now: number): Result<Coupon | null> {
  return cart.couponCode ? findCoupon(db, cart.couponCode, now) : ok(null);
}

export function priceCart(
  db: DbState,
  cart: CartRecord,
  network: Network,
  now: number,
): Result<PricedCart> {
  const coupon = resolveCoupon(db, cart, now);
  if (!coupon.ok) return coupon;
  const lines = cartLines(db, cart);
  return ok({ lines, summary: summarize(lines, coupon.value, network) });
}

/** An expired coupon is left out of the displayed summary; checkout rejects it explicitly. */
export function toCartDto(db: DbState, cart: CartRecord, now: number): Cart {
  const coupon = resolveCoupon(db, cart, now);
  const lines = cartLines(db, cart);
  return {
    lines,
    summary: summarize(lines, coupon.ok ? coupon.value : null, DEFAULT_NETWORK),
    version: cart.version,
  };
}
