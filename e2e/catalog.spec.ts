import { expect, type Page, test } from '@playwright/test';
import { editCatalogFilters, searchCatalog } from './support/flows';
import { openWithMocks } from './support/mock-api';

function catalog(page: Page) {
  return page.getByRole('region', { name: 'Mercado' });
}

function cardTitles(page: Page) {
  return catalog(page).getByRole('article').getByRole('heading', { level: 3 });
}

/** Waits until placeholder data from the previous query has been replaced. */
async function waitForResults(page: Page) {
  await expect(catalog(page).locator('[aria-busy="true"]')).toHaveCount(0);
}

/** The current price only: cards may also show a struck-through previous price. */
async function cardPrices(page: Page) {
  await waitForResults(page);
  return catalog(page)
    .getByRole('article')
    .evaluateAll((cards) =>
      cards.map((card) => Number(card.querySelector('[data-eth]')?.getAttribute('data-eth'))),
    );
}

async function openCatalog(page: Page, path = '/') {
  await openWithMocks(page, `${path}${path.includes('?') ? '&' : '?'}scenario=default`);
  await expect(catalog(page).getByText(/NFTs? encontrados?/)).toBeAttached();
}

function sortSelect(page: Page) {
  return page.getByRole('combobox', { name: /Ordenar por/ });
}

test.describe('catalog', () => {
  test('combines filters and sort, and keeps them after a refresh', async ({ page }) => {
    await openCatalog(page);

    await editCatalogFilters(page, async (panel) => {
      await panel.getByRole('button', { name: /^Arte digital/ }).click();
      await panel.getByRole('button', { name: /^Polygon/ }).click();
      await panel.getByRole('checkbox', { name: 'Somente disponíveis' }).check();
    });
    await sortSelect(page).click();
    await page.getByRole('option', { name: 'Menor preço' }).click();

    await expect(page).toHaveURL(/categories=.*digital-art/);
    await expect(page).toHaveURL(/networks=.*polygon/);
    await expect(page).toHaveURL(/onlyAvailable=true/);
    await expect(page).toHaveURL(/sort=price-asc/);
    const prices = await cardPrices(page);
    expect(prices.length).toBeGreaterThan(0);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    await page.reload();
    await expect(sortSelect(page)).toHaveText('Menor preço');
    await editCatalogFilters(page, async (panel) => {
      await expect(panel.getByRole('button', { name: /^Arte digital/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(panel.getByRole('checkbox', { name: 'Somente disponíveis' })).toBeChecked();
    });
    expect(await cardPrices(page)).toEqual(prices);
  });

  test('switches between all, new and trending pieces', async ({ page }) => {
    await openCatalog(page);
    const all = await cardTitles(page).count();

    await page.getByRole('button', { name: 'Em alta' }).click();
    await expect(page).toHaveURL(/view=trending/);
    await expect(page.getByRole('button', { name: 'Em alta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitForResults(page);
    await expect(cardTitles(page).first()).toHaveText('Sage Nomad #009');
    expect(await cardTitles(page).count()).toBeLessThanOrEqual(all);
  });

  test('searches, paginates and restores each state through browser history', async ({ page }) => {
    await openCatalog(page);
    const firstPageTitles = await cardTitles(page).allTextContents();

    await page.getByRole('link', { name: 'Página 2' }).click();
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(cardTitles(page).first()).not.toHaveText(firstPageTitles[0] ?? '');

    await searchCatalog(page, 'Golden');
    await expect(page).toHaveURL(/q=Golden/);
    await expect(page).not.toHaveURL(/page=/);
    await waitForResults(page);
    const searchTitles = await cardTitles(page).allTextContents();
    expect(searchTitles.length).toBeGreaterThan(0);
    for (const title of searchTitles) expect(title).toContain('Golden');

    await page.goBack();
    await expect(page).not.toHaveURL(/q=/);
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await page.goBack();
    await expect(cardTitles(page)).toHaveText(firstPageTitles);

    await page.goForward();
    await page.goForward();
    await expect(page).toHaveURL(/q=Golden/);
    await expect(cardTitles(page).first()).toContainText('Golden');
  });

  test('falls back to defaults for invalid search params', async ({ page }) => {
    await openCatalog(page, '/?page=abc&sort=bogus&view=nope');
    await expect(sortSelect(page)).toHaveText('Listados recentemente');
    await expect(page.getByRole('button', { name: 'Todos os NFTs' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('link', { name: 'Página 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('shows a helpful empty state when nothing matches', async ({ page }) => {
    await openCatalog(page);
    await searchCatalog(page, 'no-such-nft');
    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible();
  });
});

test.describe('nft detail', () => {
  test('opens a detail page directly by URL', async ({ page }) => {
    await openWithMocks(page, '/nfts/nft_005?scenario=default');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText('Violet Nomad #314');
    await expect(page).toHaveTitle(/^Violet Nomad #314 · /);
    await expect(page.getByRole('button', { name: 'Add to cart' })).toBeVisible();
  });

  test('handles an NFT that does not exist', async ({ page }) => {
    await openWithMocks(page, '/nfts/nft_999?scenario=default');
    await expect(page.getByRole('heading', { name: 'NFT not found' })).toBeVisible();
    await expect(page).toHaveTitle(/^NFT not found · /);

    await page.getByRole('link', { name: 'Browse the marketplace' }).click();
    await expect(page).toHaveURL('/');
    await expect(catalog(page).getByText(/NFTs? encontrados?/)).toBeAttached();
  });
});
