import { expect, type Page, test } from '@playwright/test';
import type { Order } from '../src/contracts/order';
import { addToCart, openCheckout, startSignedIn } from './support/flows';
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
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(
    page.getByRole('heading', { name: 'Aguardando confirmação do pagamento' }),
  ).toBeVisible();
  return page.url().split('/').at(-1) ?? '';
}

test.describe('realtime during checkout', () => {
  test('blocks a stale review after a price change and confirms the refreshed one', async ({
    page,
  }) => {
    await startSignedIn(page);
    await addToCart(page, STANDARD.nftId);
    await openCheckout(page);
    await waitForSocket(page);

    await updateEdition(page, STANDARD, { priceEth: '9.99' });
    await expect(
      page.getByText(/mudou de preço ou disponibilidade\. Seu carrinho foi atualizado\./),
    ).toBeVisible();
    const review = page.getByRole('region', { name: 'Seus NFTs' });
    await expect(review.getByText('Preços ou disponibilidade mudaram')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled();

    await review.getByRole('button', { name: 'Atualizar total' }).click();
    await expect(review.getByText('Preços ou disponibilidade mudaram')).toBeHidden();
    await expect(review.locator('[data-eth="9.99"]').first()).toBeVisible();

    await page.getByRole('button', { name: 'Confirmar compra' }).click();
    await expect(page).toHaveURL(/\/orders\/ord_/);
  });

  test('blocks checkout when the edition sells out', async ({ page }) => {
    await startSignedIn(page);
    await addToCart(page, STANDARD.nftId);
    await openCheckout(page);
    await waitForSocket(page);

    await updateEdition(page, STANDARD, { available: 0 });
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled();

    await page.goto('/cart');
    await expect(page.getByText('Esgotado. Remova o item para continuar.')).toBeVisible();
  });

  test('asks for a new confirmation when the price changes as the order is placed', async ({
    page,
  }) => {
    await startSignedIn(page, 'price-change');
    await addToCart(page, STANDARD.nftId);
    await openCheckout(page);

    await page.getByRole('button', { name: 'Confirmar compra' }).click();
    await expect(
      page.getByText(
        'Preços ou disponibilidade mudaram. Revise o novo total e confirme novamente.',
      ),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar compra' }).click();
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
  test('keeps a pending order across refreshes until it settles, without a second purchase', async ({
    page,
  }) => {
    await page.clock.install();
    await startSignedIn(page, 'slow-payment');
    await addToCart(page, STANDARD.nftId);
    await openCheckout(page);
    const orderId = await confirmOrder(page);

    await reloadWithMocks(page);
    await expect(
      page.getByRole('heading', { name: 'Aguardando confirmação do pagamento' }),
    ).toBeVisible();

    await page.goto('/checkout');
    await expect(page.getByText('Você tem um pedido em processamento')).toBeVisible();
    await page.getByRole('link', { name: `Acompanhar pedido ${orderId}` }).click();
    await expect(page).toHaveURL(`/orders/${orderId}`);

    await page.clock.fastForward('00:20');
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible();
    expect((await api<Order[]>(page, '/orders')).body).toHaveLength(1);
  });

  test('shows the confirmation missed while the connection was down', async ({ page }) => {
    await startSignedIn(page);
    await addToCart(page, STANDARD.nftId);
    await openCheckout(page);
    const orderId = await confirmOrder(page);
    await waitForSocket(page);

    await setSocketOnline(page, false);
    await expect
      .poll(async () => (await api<Order>(page, `/orders/${orderId}`)).body.status, {
        timeout: 8000,
      })
      .toBe('confirmed');
    await expect(
      page.getByRole('heading', { name: 'Aguardando confirmação do pagamento' }),
    ).toBeVisible();

    await setSocketOnline(page, true);
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible({
      timeout: 10_000,
    });
    expect((await api<Order[]>(page, '/orders')).body).toHaveLength(1);
  });
});
