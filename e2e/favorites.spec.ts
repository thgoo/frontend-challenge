import { expect, type Locator, type Page, test } from '@playwright/test';
import { signInThroughUi, startSignedIn } from './support/flows';
import { openWithMocks, reloadWithMocks } from './support/mock-api';

const NFT_PATH = '/nfts/nft_004';

/** Desktop shows the labeled button; mobile the heart over the image (named after the NFT). */
function favoriteButton(page: Page) {
  return page.getByRole('button', {
    name: /^(Favoritar|Favoritado)$|^Favoritar Cosmic Bloom #118$/,
  });
}

/** The UI flips optimistically, so wait for the request before reloading. */
async function toggleAndSettle(page: Page, button: Locator) {
  const settled = page.waitForResponse((response) => response.url().includes('/api/favorites/'));
  await button.click();
  await settled;
}

test.describe('favorites', () => {
  test('asks guests to sign in and returns them to the NFT', async ({ page }) => {
    await openWithMocks(page, `${NFT_PATH}?scenario=default`);
    await favoriteButton(page).click();
    await expect(page).toHaveURL(`${NFT_PATH}?auth=login`);
    await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible();

    await signInThroughUi(page);
    await expect(page).toHaveURL(NFT_PATH);
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false');
  });

  test('favorites and unfavorites, keeping the state after a refresh', async ({ page }) => {
    await startSignedIn(page, 'default', NFT_PATH);
    const button = favoriteButton(page);

    await toggleAndSettle(page, button);
    await expect(button).toHaveAttribute('aria-pressed', 'true');

    await reloadWithMocks(page);
    await expect(button).toHaveAttribute('aria-pressed', 'true');

    await toggleAndSettle(page, button);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await reloadWithMocks(page);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  test('rolls back an optimistic favorite when the server fails', async ({ page }) => {
    await startSignedIn(page, 'favorites-failure', NFT_PATH);
    const button = favoriteButton(page);
    await expect(button).toHaveAttribute('aria-pressed', 'false');

    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByText(/Não foi possível atualizar os favoritos de .*Desfizemos a alteração\./),
    ).toBeVisible();
    await expect(button).toHaveAttribute('aria-pressed', 'false');

    await reloadWithMocks(page);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  });
});
