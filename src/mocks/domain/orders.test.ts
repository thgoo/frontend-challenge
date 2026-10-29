import { describe, expect, it } from 'vitest';
import type { CreateOrderInput } from '@/contracts/order';
import { setItemQuantity, userCart } from './carts';
import { adjustAvailability, findEdition, updateEdition } from './inventory';
import { createQuote, placeOrder, settleDueOrders } from './orders';
import { createTestTx } from './testing';

const item = { nftId: 'nft_001', editionId: 'ed_001_1' };
const options = { idempotencyKey: 'key-1', outcome: 'confirmed', settleAfterMs: 1000 } as const;

async function checkoutReady(quantity = 2) {
  const tx = await createTestTx();
  const user = tx.db.users.find((candidate) => candidate.id === 'usr_alice');
  const ref = findEdition(tx.db, item);
  if (!user || !ref) throw new Error('fixture missing');
  Object.assign(ref.edition, { available: 10, maxPerOrder: 5 });
  setItemQuantity(tx.db, userCart(tx, user.id), { ...item, quantity }, 'replace');

  const quote = createQuote(tx, user.id, 'ethereum');
  if (!quote.ok) throw new Error(quote.message);
  const input: CreateOrderInput = {
    quoteId: quote.value.id,
    walletId: 'wal_alice_1',
    network: 'ethereum',
    buyer: { fullName: 'Alice Collector', email: 'alice@example.com', country: 'BR' },
  };
  return { tx, user, edition: ref.edition, input };
}

describe('orders', () => {
  it('reserves stock and starts pending', async () => {
    const { tx, user, edition, input } = await checkoutReady();
    const result = placeOrder(tx, user, input, options);

    expect(result).toMatchObject({
      ok: true,
      value: { replayed: false, order: { status: 'pending' } },
    });
    expect(edition.available).toBe(8);
    expect(tx.events.map(({ event }) => event.type)).toEqual(['nft.updated']);
  });

  it('replays the same order for the same key and rejects a different body', async () => {
    const { tx, user, edition, input } = await checkoutReady();
    const first = placeOrder(tx, user, input, options);
    const replay = placeOrder(tx, user, input, options);
    const conflict = placeOrder(tx, user, { ...input, network: 'polygon' }, options);

    expect(replay.ok && first.ok && replay.value.order.id === first.value.order.id).toBe(true);
    expect(replay).toMatchObject({ ok: true, value: { replayed: true } });
    expect(conflict).toMatchObject({ ok: false, code: 'IDEMPOTENCY_CONFLICT' });
    expect(edition.available).toBe(8);
  });

  it('rejects an outdated quote after a price change', async () => {
    const { tx, user, input } = await checkoutReady();
    updateEdition(tx, item, { priceEth: '99' });
    expect(placeOrder(tx, user, input, options)).toMatchObject({
      ok: false,
      code: 'QUOTE_OUTDATED',
    });
  });

  it('rejects the order when the edition sells out', async () => {
    const { tx, user, input } = await checkoutReady();
    adjustAvailability(tx, item, -10);
    expect(placeOrder(tx, user, input, options)).toMatchObject({
      ok: false,
      code: 'AVAILABILITY_CONFLICT',
    });
  });

  it('does not accept the same quote twice', async () => {
    const { tx, user, input } = await checkoutReady(1);
    placeOrder(tx, user, input, options);
    const second = placeOrder(tx, user, input, { ...options, idempotencyKey: 'key-2' });
    expect(second).toMatchObject({ ok: false, code: 'QUOTE_OUTDATED' });
  });

  it('confirms and removes only the purchased quantity from the cart', async () => {
    const { tx, user, input } = await checkoutReady(2);
    placeOrder(tx, user, input, options);
    setItemQuantity(tx.db, userCart(tx, user.id), { ...item, quantity: 1 }, 'add');

    settleDueOrders({ ...tx, now: tx.now + 1000 });
    const order = tx.db.orders[0];
    expect(order).toMatchObject({ status: 'confirmed', version: 2 });
    expect(order?.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(userCart(tx, user.id).items).toEqual([{ ...item, quantity: 1 }]);
    expect(tx.events.at(-1)).toMatchObject({
      event: { type: 'order.updated' },
      recipientUserId: user.id,
    });
  });

  it('declines, releases stock and keeps the cart', async () => {
    const { tx, user, edition, input } = await checkoutReady(2);
    placeOrder(tx, user, input, { ...options, outcome: 'declined' });

    settleDueOrders({ ...tx, now: tx.now + 1000 });
    expect(tx.db.orders[0]?.status).toBe('declined');
    expect(edition.available).toBe(10);
    expect(userCart(tx, user.id).items).toEqual([{ ...item, quantity: 2 }]);
  });

  it('does not settle before its time', async () => {
    const { tx, user, input } = await checkoutReady();
    placeOrder(tx, user, input, options);
    settleDueOrders({ ...tx, now: tx.now + 999 });
    expect(tx.db.orders[0]?.status).toBe('pending');
  });
});
