import { expect, type Page, test } from '@playwright/test';
import { editCatalogFilters } from './support/flows';
import { openWithMocks } from './support/mock-api';

function catalog(page: Page) {
  return page.getByRole('region', { name: 'Browse marketplace' });
}

function cardTitles(page: Page) {
  return catalog(page).getByRole('article').getByRole('heading', { level: 3 });
}

/** Waits until placeholder data from the previous query has been replaced. */
async function waitForResults(page: Page) {
  await expect(catalog(page).locator('[aria-busy="true"]')).toHaveCount(0);
}

async function cardPrices(page: Page) {
  await waitForResults(page);
  return catalog(page)
    .getByRole('article')
    .locator('[data-eth]')
    .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('data-eth'))));
}

async function openCatalog(page: Page, path = '/') {
  await openWithMocks(page, `${path}${path.includes('?') ? '&' : '?'}scenario=default`);
  await expect(catalog(page).getByText(/NFTs? found/)).toBeVisible();
}

test.describe('catalog', () => {
  test('combines filters and sort, and keeps them after a refresh', async ({ page }) => {
    await openCatalog(page);

    await editCatalogFilters(page, async (panel) => {
      await panel.getByRole('checkbox', { name: 'Art' }).check();
      await panel.getByRole('checkbox', { name: 'Only available' }).check();
    });
    await page.getByRole('combobox', { name: 'Sort by' }).click();
    await page.getByRole('option', { name: 'Price: low to high' }).click();

    await expect(page).toHaveURL(/categories=.*art.*onlyAvailable=true.*sort=price-asc/);
    await expect(catalog(page).getByText(/^\d+ NFTs? found/)).not.toHaveText(/^48 /);
    const prices = await cardPrices(page);
    expect(prices.length).toBeGreaterThan(1);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveText('Price: low to high');
    await editCatalogFilters(page, async (panel) => {
      await expect(panel.getByRole('checkbox', { name: 'Art' })).toBeChecked();
      await expect(panel.getByRole('checkbox', { name: 'Only available' })).toBeChecked();
    });
    expect(await cardPrices(page)).toEqual(prices);
  });

  test('searches, paginates and restores each state through browser history', async ({ page }) => {
    await openCatalog(page);
    const firstPageTitles = await cardTitles(page).allTextContents();

    await page.getByRole('link', { name: 'Page 2' }).click();
    await expect(page.getByRole('link', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(cardTitles(page).first()).not.toHaveText(firstPageTitles[0] ?? '');

    await page.getByRole('searchbox', { name: 'Search NFTs' }).fill('Galaxy');
    await expect(page).toHaveURL(/q=Galaxy/);
    await expect(page).not.toHaveURL(/page=/);
    await waitForResults(page);
    const searchTitles = await cardTitles(page).allTextContents();
    expect(searchTitles.length).toBeGreaterThan(0);
    for (const title of searchTitles) expect(title).toContain('Galaxy');

    await page.goBack();
    await expect(page.getByRole('searchbox', { name: 'Search NFTs' })).toHaveValue('');
    await expect(page.getByRole('link', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await page.goBack();
    await expect(cardTitles(page)).toHaveText(firstPageTitles);

    await page.goForward();
    await page.goForward();
    await expect(page.getByRole('searchbox', { name: 'Search NFTs' })).toHaveValue('Galaxy');
    await expect(cardTitles(page).first()).toContainText('Galaxy');
  });

  test('falls back to defaults for invalid search params', async ({ page }) => {
    await openCatalog(page, '/?page=abc&sort=bogus');
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveText('Newest');
    await expect(page.getByRole('link', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('shows a helpful empty state when nothing matches', async ({ page }) => {
    await openCatalog(page);
    await page.getByRole('searchbox', { name: 'Search NFTs' }).fill('no-such-nft');
    await expect(page.getByRole('heading', { name: 'No NFTs found' })).toBeVisible();
  });
});

test.describe('nft detail', () => {
  test('opens a detail page directly by URL', async ({ page }) => {
    await openWithMocks(page, '/nfts/nft_005?scenario=default');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText('#5');
    await expect(page).toHaveTitle(`${await heading.textContent()} · NFT Marketplace`);
    await expect(page.getByRole('button', { name: 'Add to cart' })).toBeVisible();
  });

  test('handles an NFT that does not exist', async ({ page }) => {
    await openWithMocks(page, '/nfts/nft_999?scenario=default');
    await expect(page.getByRole('heading', { name: 'NFT not found' })).toBeVisible();
    await expect(page).toHaveTitle('NFT not found · NFT Marketplace');

    await page.getByRole('link', { name: 'Browse the marketplace' }).click();
    await expect(page).toHaveURL('/');
    await expect(catalog(page).getByText(/NFTs? found/)).toBeVisible();
  });
});
