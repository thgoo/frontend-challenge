import { describe, expect, it } from 'vitest';
import { findEdition, purchasableQuantity } from './inventory';
import {
  applyCoupon,
  guestCart,
  mergeGuestCart,
  setItemQuantity,
  toCartDto,
  userCart,
} from './carts';
import { createTestTx, NOW } from './testing';

const item = { nftId: 'nft_001', editionId: 'ed_001_1' };

describe('carts', () => {
  it('rejects quantities above the purchasable limit', async () => {
    const tx = await createTestTx();
    const ref = findEdition(tx.db, item);
    if (!ref) throw new Error('fixture missing');
    const limit = purchasableQuantity(ref.edition);

    const result = setItemQuantity(
      tx.db,
      userCart(tx, 'usr_alice'),
      { ...item, quantity: limit + 1 },
      'replace',
    );
    expect(result).toMatchObject({ ok: false, code: 'AVAILABILITY_CONFLICT' });
  });

  it('merges the guest cart into the user cart, clamped to availability', async () => {
    const tx = await createTestTx();
    const ref = findEdition(tx.db, item);
    if (!ref) throw new Error('fixture missing');
    const limit = purchasableQuantity(ref.edition);

    setItemQuantity(tx.db, userCart(tx, 'usr_alice'), { ...item, quantity: limit }, 'replace');
    const guest = guestCart(tx, undefined);
    setItemQuantity(tx.db, guest, { ...item, quantity: 1 }, 'replace');

    mergeGuestCart(tx, guest.id, 'usr_alice');
    expect(userCart(tx, 'usr_alice').items).toEqual([{ ...item, quantity: limit }]);
    expect(tx.db.carts.some((cart) => cart.id === guest.id)).toBe(false);
  });

  it('prices the cart with coupon and network fee using exact decimals', async () => {
    const tx = await createTestTx();
    const ref = findEdition(tx.db, item);
    if (!ref) throw new Error('fixture missing');
    ref.edition.priceEth = '0.1';
    const cart = userCart(tx, 'usr_alice');
    setItemQuantity(tx.db, cart, { ...item, quantity: 3 }, 'replace');
    applyCoupon(tx.db, cart, 'welcome10', NOW);

    expect(toCartDto(tx.db, cart, NOW).summary).toEqual({
      network: 'ethereum',
      coupon: { code: 'WELCOME10', basisPoints: 1000 },
      subtotalEth: '0.3',
      discountEth: '0.03',
      networkFeeEth: '0.0021',
      totalEth: '0.2721',
    });
  });

  it.each([
    ['NOPE', 'COUPON_INVALID'],
    ['SUMMER20', 'COUPON_EXPIRED'],
  ])('rejects coupon %s with %s', async (code, error) => {
    const tx = await createTestTx();
    expect(applyCoupon(tx.db, userCart(tx, 'usr_alice'), code, NOW)).toMatchObject({
      ok: false,
      code: error,
    });
  });
});
