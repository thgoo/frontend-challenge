import { expect, test, type Page } from '@playwright/test';
import type { Cart } from '../src/contracts/cart';
import type { Order } from '../src/contracts/order';
import type { Quote } from '../src/contracts/quote';
import { ALICE, api, BOB, login, openWithMocks, reloadWithMocks } from './support/mock-api';

const ITEM = { nftId: 'nft_002', editionId: 'ed_002_1' };
const BUYER = { fullName: 'Alice Collector', email: 'alice@example.com', country: 'BR' };

async function addToCart(page: Page, quantity = 1) {
  return api<Cart>(page, '/cart/items', { method: 'POST', body: { ...ITEM, quantity } });
}

async function quote(page: Page) {
  const result = await api<Quote>(page, '/quotes', {
    method: 'POST',
    body: { network: 'ethereum' },
  });
  expect(result.status).toBe(201);
  return result.body;
}

function orderCall(quoteId: string, key: string, timeoutMs?: number) {
  return {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body: { quoteId, walletId: 'wal_alice_1', network: 'ethereum', buyer: BUYER },
    timeoutMs,
  };
}

async function expectOrderStatus(page: Page, orderId: string, status: Order['status']) {
  await expect
    .poll(async () => (await api<Order>(page, `/orders/${orderId}`)).body.status, { timeout: 8000 })
    .toBe(status);
}

test.describe('mock commerce api', () => {
  test('keeps the guest cart across reloads and merges it on login', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    expect((await addToCart(page)).status).toBe(200);

    await reloadWithMocks(page);
    expect((await api<Cart>(page, '/cart')).body.lines).toHaveLength(1);

    await login(page, ALICE);
    expect((await api<Cart>(page, '/cart')).body.lines).toMatchObject([{ ...ITEM, quantity: 1 }]);

    await api(page, '/auth/logout', { method: 'POST' });
    expect((await api<Cart>(page, '/cart')).body.lines).toEqual([]);
  });

  test('applies, rejects and removes coupons', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    await addToCart(page);

    expect(
      await api(page, '/cart/coupon', { method: 'PUT', body: { code: 'nope' } }),
    ).toMatchObject({
      status: 422,
      body: { code: 'COUPON_INVALID' },
    });
    expect(
      await api(page, '/cart/coupon', { method: 'PUT', body: { code: 'SUMMER20' } }),
    ).toMatchObject({
      status: 422,
      body: { code: 'COUPON_EXPIRED' },
    });

    const applied = await api<Cart>(page, '/cart/coupon', {
      method: 'PUT',
      body: { code: 'welcome10' },
    });
    expect(applied.body.summary.coupon).toEqual({ code: 'WELCOME10', basisPoints: 1000 });

    const removed = await api<Cart>(page, '/cart/coupon', { method: 'DELETE' });
    expect(removed.body.summary).toMatchObject({ coupon: null, discountEth: '0' });
  });

  test('confirms an order and removes the purchased items from the cart', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    await login(page, ALICE);
    await addToCart(page);

    const { id: quoteId } = await quote(page);
    const created = await api<Order>(page, '/orders', orderCall(quoteId, 'key-confirm'));
    expect(created).toMatchObject({ status: 201, body: { status: 'pending' } });

    await expectOrderStatus(page, created.body.id, 'confirmed');
    expect((await api<Cart>(page, '/cart')).body.lines).toEqual([]);
  });

  test('recovers the same order after a timeout using the idempotency key', async ({ page }) => {
    await openWithMocks(page, '/?scenario=order-timeout');
    await login(page, ALICE);
    await addToCart(page);
    const { id: quoteId } = await quote(page);

    expect((await api(page, '/orders', orderCall(quoteId, 'key-timeout', 1500))).status).toBe(0);
    const retried = await api<Order>(page, '/orders', orderCall(quoteId, 'key-timeout'));
    expect(retried.status).toBe(200);

    const orders = await api<Order[]>(page, '/orders');
    expect(orders.body.map((order) => order.id)).toEqual([retried.body.id]);
  });

  test('requires a new quote when the price changes during checkout', async ({ page }) => {
    await openWithMocks(page, '/?scenario=price-change');
    await login(page, ALICE);
    await addToCart(page);

    const stale = await quote(page);
    expect(await api(page, '/orders', orderCall(stale.id, 'key-stale'))).toMatchObject({
      status: 409,
      body: { code: 'QUOTE_OUTDATED' },
    });

    const fresh = await quote(page);
    expect(fresh.totalEth).not.toBe(stale.totalEth);
    expect((await api(page, '/orders', orderCall(fresh.id, 'key-fresh'))).status).toBe(201);
  });

  test('keeps the cart when the payment is declined', async ({ page }) => {
    await openWithMocks(page, '/?scenario=payment-declined');
    await login(page, ALICE);
    await addToCart(page);

    const { id: quoteId } = await quote(page);
    const created = await api<Order>(page, '/orders', orderCall(quoteId, 'key-declined'));
    await expectOrderStatus(page, created.body.id, 'declined');
    expect((await api<Cart>(page, '/cart')).body.lines).toHaveLength(1);
  });

  test('isolates orders between users', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    await login(page, ALICE);
    await addToCart(page);
    const { id: quoteId } = await quote(page);
    const created = await api<Order>(page, '/orders', orderCall(quoteId, 'key-private'));

    await api(page, '/auth/logout', { method: 'POST' });
    await login(page, BOB);
    expect((await api(page, `/orders/${created.body.id}`)).status).toBe(403);
    expect((await api<Order[]>(page, '/orders')).body).toEqual([]);
  });
});

test.describe('mock account api', () => {
  test('updates the profile and rejects taken usernames', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    await login(page, ALICE);
    const update = { name: 'Alice C.', username: 'alice_c', email: ALICE.email, bio: 'Hi' };

    expect(await api(page, '/profile', { method: 'PATCH', body: update })).toMatchObject({
      status: 200,
      body: { username: 'alice_c' },
    });
    const taken = await api(page, '/profile', {
      method: 'PATCH',
      body: { ...update, username: 'bob' },
    });
    expect(taken.status).toBe(409);
    expect(taken.body).toHaveProperty('fieldErrors.username');
  });

  test('uploads an avatar and validates its type', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    await login(page, ALICE);

    const statuses = await page.evaluate(async () => {
      const upload = async (file: File) => {
        const form = new FormData();
        form.append('avatar', file);
        return (await fetch('/api/profile/avatar', { method: 'PUT', body: form })).status;
      };
      return [
        await upload(new File([new Uint8Array([137, 80, 78, 71])], 'a.png', { type: 'image/png' })),
        await upload(new File(['text'], 'a.txt', { type: 'text/plain' })),
      ];
    });
    expect(statuses).toEqual([200, 422]);
    expect((await api<{ avatarUrl: string }>(page, '/profile')).body.avatarUrl).toMatch(
      /^data:image\/png;base64,/,
    );
  });

  test('changes the password only with the current one', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    await login(page, ALICE);

    const wrong = { currentPassword: 'Wrong12345', newPassword: 'NewPassword1' };
    expect((await api(page, '/profile/password', { method: 'PUT', body: wrong })).status).toBe(422);

    const right = { currentPassword: ALICE.password, newPassword: 'NewPassword1' };
    expect((await api(page, '/profile/password', { method: 'PUT', body: right })).status).toBe(204);
    expect(
      (
        await api(page, '/auth/login', {
          method: 'POST',
          body: { ...ALICE, password: 'NewPassword1' },
        })
      ).status,
    ).toBe(200);
  });

  test('upserts wallets per slot and rejects duplicated addresses', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    await login(page, BOB);
    const wallet = { label: 'Main', address: `0x${'a'.repeat(40)}`, provider: 'metamask' };

    expect((await api(page, '/wallets/primary', { method: 'PUT', body: wallet })).status).toBe(200);
    const duplicated = await api(page, '/wallets/secondary', { method: 'PUT', body: wallet });
    expect(duplicated.status).toBe(409);
    expect(duplicated.body).toHaveProperty('fieldErrors.address');
    expect((await api(page, '/wallets/tertiary', { method: 'PUT', body: wallet })).status).toBe(
      404,
    );
  });

  test('favorites require a session and persist per user', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    expect((await api(page, '/favorites')).status).toBe(401);

    await login(page, ALICE);
    await api(page, '/favorites/nft_003', { method: 'PUT' });
    await reloadWithMocks(page);
    expect((await api(page, '/favorites')).body).toEqual({ nftIds: ['nft_003'] });

    await api(page, '/auth/logout', { method: 'POST' });
    await login(page, BOB);
    expect((await api(page, '/favorites')).body).toEqual({ nftIds: [] });
  });
});
