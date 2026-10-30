import { expect, type Page, test } from '@playwright/test';
import type { Order } from '../src/contracts/order';
import { addToCart, reachReview, startSignedIn } from './support/flows';
import { api } from './support/mock-api';

async function orderCount(page: Page) {
  return (await api<Order[]>(page, '/orders')).body.length;
}

test.describe('checkout failures', () => {
  test('keeps the cart after a declined payment and lets the user retry', async ({ page }) => {
    await startSignedIn(page, 'payment-declined');
    await addToCart(page, 'nft_002');
    await reachReview(page);
    await page.getByRole('button', { name: 'Confirm and pay' }).click();

    await expect(
      page.getByRole('heading', { name: 'Waiting for payment confirmation' }),
    ).toBeVisible();
    const declined = page.getByRole('alert').filter({ hasText: 'Payment declined' });
    await expect(declined).toBeVisible({ timeout: 10_000 });
    await expect(declined).toContainText('The payment was declined by the wallet.');

    await declined.getByRole('link', { name: 'Back to checkout' }).click();
    await expect(page.getByRole('button', { name: 'Review order' })).toBeVisible();
  });

  test('creates a single order when confirm is clicked repeatedly', async ({ page }) => {
    await startSignedIn(page);
    await addToCart(page, 'nft_002');
    await reachReview(page);

    await page.getByRole('button', { name: 'Confirm and pay' }).dblclick();
    await expect(page).toHaveURL(/\/orders\/ord_/);
    expect(await orderCount(page)).toBe(1);
  });

  test('recovers the same order after the request times out', async ({ page }) => {
    test.slow();
    await startSignedIn(page, 'order-timeout');
    await addToCart(page, 'nft_002');
    await reachReview(page);

    await page.getByRole('button', { name: 'Confirm and pay' }).click();
    await expect(page.getByRole('button', { name: 'Placing order…' })).toBeDisabled();

    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Thank you for your purchase' })).toBeVisible({
      timeout: 10_000,
    });
    expect(await orderCount(page)).toBe(1);
  });
});
