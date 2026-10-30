import { expect, type Page, test } from '@playwright/test';
import type { Order } from '../src/contracts/order';
import { addToCart, reachReview, startSignedIn } from './support/flows';
import {
  api,
  openWithMocks,
  reloadWithMocks,
  updateEdition,
  waitForSocket,
} from './support/mock-api';

const STANDARD = { nftId: 'nft_002', editionId: 'ed_002_1' };
const OTHER = { nftId: 'nft_001', editionId: 'ed_001_1' };

function cardPrice(page: Page, nftId: string) {
  return page
    .getByRole('region', { name: 'Mercado' })
    .getByRole('article')
    .filter({ has: page.locator(`a[href="/nfts/${nftId}"]`) })
    .locator('[data-eth]')
    .first();
}

async function setSocketOnline(page: Page, online: boolean) {
  await page.evaluate((value) => {
    window.__mocks?.sockets.setOnline(value);
  }, online);
}

async function confirmOrder(page: Page) {
  await page.getByRole('button', { name: 'Confirm and pay' }).click();
  await expect(
    page.getByRole('heading', { name: 'Waiting for payment confirmation' }),
  ).toBeVisible();
  return page.url().split('/').at(-1) ?? '';
}

test.describe('realtime during checkout', () => {
  test('blocks a stale review after a price change and confirms the refreshed one', async ({
    page,
  }) => {
    await startSignedIn(page);
    await addToCart(page, STANDARD.nftId);
    await reachReview(page);
    await waitForSocket(page);

    await updateEdition(page, STANDARD, { priceEth: '9.99' });
    await expect(
      page.getByText(/mudou de preço ou disponibilidade\. Seu carrinho foi atualizado\./),
    ).toBeVisible();
    const review = page.getByRole('region', { name: 'Review your order' });
    await expect(review.getByText('Prices or availability changed')).toBeVisible();
    await expect(review.getByRole('button', { name: 'Confirm and pay' })).toBeDisabled();

    await review.getByRole('button', { name: 'Refresh review' }).click();
    await expect(review.getByText('Prices or availability changed')).toBeHidden();
    await expect(review.locator('[data-eth="9.99"]').first()).toBeVisible();

    await review.getByRole('button', { name: 'Confirm and pay' }).click();
    await expect(page).toHaveURL(/\/orders\/ord_/);
  });

  test('blocks checkout when the edition sells out', async ({ page }) => {
    await startSignedIn(page);
    await addToCart(page, STANDARD.nftId);
    await reachReview(page);
    await waitForSocket(page);

    await updateEdition(page, STANDARD, { available: 0 });
    const review = page.getByRole('region', { name: 'Review your order' });
    await expect(review.getByRole('button', { name: 'Confirm and pay' })).toBeDisabled();

    await page.goto('/cart');
    await expect(page.getByText('Sold out. Remove it to continue.')).toBeVisible();
  });

  test('asks for a new confirmation when the price changes as the order is placed', async ({
    page,
  }) => {
    await startSignedIn(page, 'price-change');
    await addToCart(page, STANDARD.nftId);
    await reachReview(page);

    await page.getByRole('button', { name: 'Confirm and pay' }).click();
    await expect(
      page.getByText('Prices or availability changed. Review the updated total and confirm again.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Confirm and pay' }).click();
    await expect(page).toHaveURL(/\/orders\/ord_/);
  });
});

test.describe('realtime consistency', () => {
  test('ignores outdated and duplicated events', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    await waitForSocket(page);

    await updateEdition(page, STANDARD, { priceEth: '0.011' });
    await expect(cardPrice(page, STANDARD.nftId)).toHaveAttribute('data-eth', '0.011');
    await updateEdition(page, STANDARD, { priceEth: '0.022' });
    await expect(cardPrice(page, STANDARD.nftId)).toHaveAttribute('data-eth', '0.022');

    await page.evaluate((nftId) => {
      const sockets = window.__mocks?.sockets;
      const events = sockets?.deliveredEvents().filter((event) => event.resourceId === nftId) ?? [];
      for (const event of events) sockets?.redeliver(event.eventId);
    }, STANDARD.nftId);
    // Events arrive in order, so once this one shows up the redelivered ones were handled.
    await updateEdition(page, OTHER, { priceEth: '0.033' });
    await expect(cardPrice(page, OTHER.nftId)).toHaveAttribute('data-eth', '0.033');
    await expect(cardPrice(page, STANDARD.nftId)).toHaveAttribute('data-eth', '0.022');
  });

  test('reconciles with the API after the socket reconnects', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    await waitForSocket(page);
    const price = cardPrice(page, STANDARD.nftId);
    const initial = await price.getAttribute('data-eth');

    await setSocketOnline(page, false);
    await updateEdition(page, STANDARD, { priceEth: '0.044' });
    // A round trip to page 2 gives a wrongly delivered event time to land before checking it did not.
    await page.getByRole('link', { name: 'Página 2' }).click();
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await page.goBack();
    await expect(price).toHaveAttribute('data-eth', initial ?? '');

    await setSocketOnline(page, true);
    await expect(price).toHaveAttribute('data-eth', '0.044', {
      timeout: 10_000,
    });
  });
});

test.describe('pending orders', () => {
  test('keeps a pending order across refreshes and prevents a second purchase', async ({
    page,
  }) => {
    await startSignedIn(page, 'slow-payment');
    await addToCart(page, STANDARD.nftId);
    await reachReview(page);
    const orderId = await confirmOrder(page);

    await reloadWithMocks(page);
    await expect(
      page.getByRole('heading', { name: 'Waiting for payment confirmation' }),
    ).toBeVisible();

    await page.goto('/checkout');
    await expect(page.getByText('You have an order being processed')).toBeVisible();
    await page.getByRole('link', { name: `Track order ${orderId}` }).click();
    await expect(page).toHaveURL(`/orders/${orderId}`);
    expect((await api<Order[]>(page, '/orders')).body).toHaveLength(1);
  });

  test('shows the confirmation missed while the connection was down', async ({ page }) => {
    await startSignedIn(page);
    await addToCart(page, STANDARD.nftId);
    await reachReview(page);
    const orderId = await confirmOrder(page);
    await waitForSocket(page);

    await setSocketOnline(page, false);
    await expect
      .poll(async () => (await api<Order>(page, `/orders/${orderId}`)).body.status, {
        timeout: 8000,
      })
      .toBe('confirmed');
    await expect(
      page.getByRole('heading', { name: 'Waiting for payment confirmation' }),
    ).toBeVisible();

    await setSocketOnline(page, true);
    await expect(page.getByRole('heading', { name: 'Thank you for your purchase' })).toBeVisible({
      timeout: 10_000,
    });
    expect((await api<Order[]>(page, '/orders')).body).toHaveLength(1);
  });
});
