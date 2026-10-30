import { expect, type Locator, type Page, test } from '@playwright/test';
import { signInThroughUi, startSignedIn } from './support/flows';
import { openWithMocks, reloadWithMocks } from './support/mock-api';

const NFT_PATH = '/nfts/nft_004';

/** The UI flips optimistically, so wait for the request before reloading. */
async function toggleAndSettle(page: Page, button: Locator) {
  const settled = page.waitForResponse((response) => response.url().includes('/api/favorites/'));
  await button.click();
  await settled;
}

test.describe('favorites', () => {
  test('asks guests to sign in and returns them to the NFT', async ({ page }) => {
    await openWithMocks(page, `${NFT_PATH}?scenario=default`);
    await page.getByRole('button', { name: 'Add to favorites' }).click();
    await expect(page).toHaveURL(/\/login\?redirect=%2Fnfts%2Fnft_004/);

    await signInThroughUi(page);
    await expect(page).toHaveURL(NFT_PATH);
    await expect(page.getByRole('button', { name: 'Add to favorites' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('favorites and unfavorites, keeping the state after a refresh', async ({ page }) => {
    await startSignedIn(page, 'default', NFT_PATH);
    const button = page.getByRole('button', { name: /favorite/i });

    await toggleAndSettle(page, button);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(button).toHaveText('Favorited');

    await reloadWithMocks(page);
    await expect(button).toHaveAttribute('aria-pressed', 'true');

    await toggleAndSettle(page, button);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await reloadWithMocks(page);
    await expect(button).toHaveText('Add to favorites');
  });

  test('rolls back an optimistic favorite when the server fails', async ({ page }) => {
    await startSignedIn(page, 'favorites-failure', NFT_PATH);
    const button = page.getByRole('button', { name: /favorite/i });
    await expect(button).toHaveAttribute('aria-pressed', 'false');

    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByText(/Could not update favorites for .*Your change was undone\./),
    ).toBeVisible();
    await expect(button).toHaveAttribute('aria-pressed', 'false');

    await reloadWithMocks(page);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  });
});
