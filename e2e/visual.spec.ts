import { expect, type Page, test } from '@playwright/test';
import { startSignedIn } from './support/flows';
import { api, openWithMocks } from './support/mock-api';

const CART_ITEMS = [
  { nftId: 'nft_001', editionId: 'ed_001_1', quantity: 2 },
  { nftId: 'nft_005', editionId: 'ed_005_1', quantity: 1 },
];

/** Settles everything that could vary between runs before taking a full-page screenshot. */
async function stabilize(page: Page) {
  await page.evaluate(async () => {
    for (const image of document.querySelectorAll('img')) image.loading = 'eager';
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((image) =>
        image.complete ? Promise.resolve() : image.decode().catch(() => undefined),
      ),
    );
  });
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.mouse.move(0, 0);
}

async function fillCart(page: Page) {
  for (const item of CART_ITEMS) {
    expect((await api(page, '/cart/items', { method: 'POST', body: item })).status).toBe(200);
  }
}

test.describe('visual regression', () => {
  test('home', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    await expect(page.getByText(/NFTs? encontrados?/)).toBeAttached();
    await stabilize(page);
    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  });

  test('nft detail', async ({ page }) => {
    await openWithMocks(page, '/nfts/nft_001?scenario=default');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Emerald Ape #042');
    await stabilize(page);
    await expect(page).toHaveScreenshot('detail.png', { fullPage: true });
  });

  test('cart', async ({ page }) => {
    await openWithMocks(page, '/login?scenario=default');
    await fillCart(page);
    await page.goto('/cart');
    await expect(page.getByRole('group', { name: /^Quantidade de / })).toHaveCount(2);
    await stabilize(page);
    await expect(page).toHaveScreenshot('cart.png', { fullPage: true });
  });

  test('checkout', async ({ page }) => {
    await startSignedIn(page);
    await fillCart(page);
    await page.goto('/checkout');
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled();
    await stabilize(page);
    await expect(page).toHaveScreenshot('checkout.png', { fullPage: true });
  });
});
