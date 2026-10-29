import { expect, test } from '@playwright/test';
import { addToCart, reachReview, startSignedIn } from './support/flows';

test('buys an NFT from the catalog to a confirmed receipt', async ({ page }) => {
  await startSignedIn(page);
  const featured = page.getByRole('region', { name: 'Featured NFTs' }).getByRole('link').nth(1);
  const name = await featured.textContent();
  await featured.click();
  await expect(page.getByRole('heading', { level: 1, name: name ?? '' })).toBeVisible();

  await addToCart(page, 'nft_002');
  await page.goto('/cart');
  await expect(page.getByRole('link', { name: name ?? '' })).toBeVisible();

  await reachReview(page);
  await page.getByRole('button', { name: 'Confirm and pay' }).click();

  await expect(
    page.getByRole('heading', { name: 'Waiting for payment confirmation' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Thank you for your purchase' })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText(/^0x[0-9a-f]{64}$/)).toBeVisible();

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
});
