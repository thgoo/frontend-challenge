import { expect, type Page, test } from '@playwright/test';
import { openWithMocks } from './support/mock-api';

const LOADED_TIMEOUT = { timeout: 15_000 };

/**
 * The first load renders once the session and the route data resolve together, so skeletons
 * show up on client-side navigation: start on the (empty) cart, then move into the catalog.
 */
async function enterCatalogFromCart(page: Page) {
  await openWithMocks(page, '/cart?scenario=slow');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible(
    LOADED_TIMEOUT,
  );
  await page.getByRole('link', { name: 'Explorar o mercado' }).click();
}

test.describe('loading states', () => {
  test('shows shimmer skeletons while the catalog loads slowly', async ({ page }) => {
    await enterCatalogFromCart(page);
    const catalog = page.getByRole('region', { name: 'Mercado' });

    await expect(catalog.getByRole('status').filter({ hasText: 'Carregando NFTs' })).toBeAttached();
    const skeleton = catalog.locator('[data-slot="skeleton"]').first();
    await expect(skeleton).toBeVisible();
    expect(await skeleton.evaluate((node) => getComputedStyle(node).animationName)).not.toBe(
      'none',
    );

    await expect(catalog.getByText(/NFTs? encontrados?/)).toBeAttached(LOADED_TIMEOUT);
    await expect(catalog.locator('[data-slot="skeleton"]')).toHaveCount(0);
  });

  test('stops the shimmer for users who prefer reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await enterCatalogFromCart(page);
    const skeleton = page.locator('[data-slot="skeleton"]:visible').first();
    await expect(skeleton).toBeVisible();
    expect(await skeleton.evaluate((node) => getComputedStyle(node).animationName)).toBe('none');
  });

  test('shows skeletons for the NFT detail and the cart', async ({ page }) => {
    await enterCatalogFromCart(page);
    await page
      .getByRole('region', { name: 'Mercado' })
      .getByRole('article')
      .getByRole('link', { name: 'Sage Nomad #009' })
      .click(LOADED_TIMEOUT);
    await expect(page.getByRole('status').filter({ hasText: 'Carregando NFT' })).toBeAttached();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Sage Nomad #009',
      LOADED_TIMEOUT,
    );

    await openWithMocks(page, '/cart?scenario=slow');
    await expect(
      page.getByRole('status').filter({ hasText: 'Carregando seu carrinho' }),
    ).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible(
      LOADED_TIMEOUT,
    );
  });
});

test.describe('failures and recovery', () => {
  test('recovers when the app starts without a connection', async ({ page }) => {
    await openWithMocks(page, '/?scenario=offline');
    const error = page
      .getByRole('alert')
      .filter({ hasText: 'Não foi possível conectar ao servidor' });
    await expect(error).toBeVisible(LOADED_TIMEOUT);

    await page.evaluate(() => window.__mocks?.reset('default'));
    await error.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByText(/NFTs? encontrados?/)).toBeAttached();
  });

  test('explains a failed catalog page and recovers on retry', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    await expect(page.getByText(/NFTs? encontrados?/)).toBeAttached();

    await page.evaluate(() => window.__mocks?.reset('offline'));
    await page.getByRole('link', { name: 'Página 2' }).click();
    const error = page
      .getByRole('alert')
      .filter({ hasText: 'Não foi possível carregar o catálogo' });
    await expect(error).toBeVisible(LOADED_TIMEOUT);

    await page.evaluate(() => window.__mocks?.reset('default'));
    await error.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(error).toBeHidden();
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('retries transient server errors without bothering the user', async ({ page }) => {
    await openWithMocks(page, '/?scenario=flaky');
    await expect(page.getByText(/NFTs? encontrados?/)).toBeAttached(LOADED_TIMEOUT);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('shows the not found page for an unknown NFT instead of an error', async ({ page }) => {
    await openWithMocks(page, '/nfts/nft_404?scenario=default');
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
