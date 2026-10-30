import { expect, test } from '@playwright/test';
import { startSignedIn } from './support/flows';
import { openWithMocks } from './support/mock-api';

test.describe('keyboard and focus', () => {
  test('skips straight to the main content', async ({ page }) => {
    await openWithMocks(page, '/?scenario=default');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('traps focus in the filters drawer and restores it on close', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Filters open in a drawer below the desktop breakpoint');
    await openWithMocks(page, '/?scenario=default');
    const trigger = page.getByRole('button', { name: /^Filters/ });
    await trigger.focus();
    await page.keyboard.press('Enter');

    const drawer = page.getByRole('dialog', { name: 'Filters' });
    await expect(drawer).toBeVisible();
    for (let step = 0; step < 15; step += 1) {
      await page.keyboard.press('Tab');
      expect(await drawer.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('opens the account menu and navigates with the keyboard', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Covered by the drawer test on mobile');
    await startSignedIn(page);
    const trigger = page.getByRole('button', { name: /^Account menu for / });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Wallets' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/wallets');
  });

  test('adds an NFT to the cart using only the keyboard', async ({ page }) => {
    await openWithMocks(page, '/nfts/nft_002?scenario=default');
    await page.getByRole('button', { name: 'Increase quantity' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('group', { name: 'Quantity' }).getByRole('status')).toHaveText('2');

    await page.getByRole('button', { name: 'Add to cart' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Added 2 ×/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible();
  });
});

test.describe('form validation', () => {
  test('focuses the first invalid field and describes each error', async ({ page }) => {
    await openWithMocks(page, '/login?scenario=default');
    const email = page.getByLabel('Email');
    const password = page.getByLabel('Password');

    await email.fill('not-an-email');
    await email.press('Enter');
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAccessibleDescription('Informe um e-mail válido');
    await expect(password).toHaveAccessibleDescription('Informe sua senha');

    await email.fill('alice@example.com');
    await password.fill('Password123');
    await password.press('Enter');
    await expect(page).toHaveURL('/');
  });
});
