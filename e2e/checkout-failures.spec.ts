import { expect, type Page, test } from '@playwright/test';
import type { Order } from '../src/contracts/order';
import { addToCart, openCheckout, startSignedIn } from './support/flows';
import { api } from './support/mock-api';

async function orderCount(page: Page) {
  return (await api<Order[]>(page, '/orders')).body.length;
}

test.describe('checkout failures', () => {
  test('keeps the cart after a declined payment and lets the user retry', async ({ page }) => {
    await startSignedIn(page, 'payment-declined');
    await addToCart(page, 'nft_002');
    await openCheckout(page);
    await page.getByRole('button', { name: 'Confirmar compra' }).click();

    await expect(
      page.getByRole('heading', { name: 'Aguardando confirmação do pagamento' }),
    ).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'Pagamento recusado' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('A carteira recusou o pagamento.')).toBeVisible();

    await page.getByRole('link', { name: 'Voltar ao pagamento' }).click();
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible();
  });

  test('explains a rejected wallet connection and keeps the cart', async ({ page }) => {
    await startSignedIn(page, 'wallet-rejected');
    await addToCart(page, 'nft_002');
    await openCheckout(page);

    await page.getByRole('button', { name: 'Confirmar compra' }).click();
    await expect(page.getByRole('alert')).toContainText('recusou a conexão');
    await expect(page).toHaveURL('/checkout');
    expect(await orderCount(page)).toBe(0);
  });

  test('reconnects after the wallet disconnects during checkout', async ({ page }) => {
    await startSignedIn(page);
    await addToCart(page, 'nft_002');
    await api(page, '/wallet-connection', {
      method: 'PUT',
      body: { walletId: 'wal_alice_1', network: 'ethereum' },
    });
    await openCheckout(page);
    await page.evaluate(() => window.__mocks?.disconnectWallets());

    await page.getByRole('button', { name: 'Confirmar compra' }).click();
    await expect(page.getByRole('alert')).toContainText('Sua carteira foi desconectada');
    expect(await orderCount(page)).toBe(0);

    await page.getByRole('button', { name: 'Confirmar compra' }).click();
    await expect(page).toHaveURL(/\/orders\/ord_/);
    expect(await orderCount(page)).toBe(1);
  });

  test('creates a single order when confirm is clicked repeatedly', async ({ page }) => {
    await startSignedIn(page);
    await addToCart(page, 'nft_002');
    await openCheckout(page);

    await page.getByRole('button', { name: 'Confirmar compra' }).dblclick();
    await expect(page).toHaveURL(/\/orders\/ord_/);
    expect(await orderCount(page)).toBe(1);
  });

  test('recovers the same order after the request times out', async ({ page }) => {
    test.slow();
    await startSignedIn(page, 'order-timeout');
    await addToCart(page, 'nft_002');
    await openCheckout(page);

    await page.getByRole('button', { name: 'Confirmar compra' }).click();
    await expect(page.getByRole('button', { name: 'Confirmando…' })).toBeDisabled();

    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible({
      timeout: 10_000,
    });
    expect(await orderCount(page)).toBe(1);
  });
});
