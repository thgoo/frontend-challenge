import { expect, test } from '@playwright/test';
import { addToCart, signInThroughUi, signOutThroughUi, startSignedIn } from './support/flows';
import { BOB, openWithMocks } from './support/mock-api';

const CAROL = { email: 'carol@example.com', password: 'Password123' };

test.describe('auth', () => {
  test('registers with validation, signs out and signs back in', async ({ page }) => {
    await openWithMocks(page, '/register?scenario=default');
    const create = page.getByRole('button', { name: 'Create account' });

    await create.click();
    await expect(page.getByText('Enter your name')).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('Name', { exact: true }).fill('Carol Collector');
    await page.getByLabel('Username').fill('Carol!');
    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Password').fill('short');
    await create.click();
    await expect(
      page.getByText('Use 3-20 lowercase letters, numbers or underscores'),
    ).toBeVisible();
    await expect(page.getByText('Use at least 8 characters')).toBeVisible();

    await page.getByLabel('Username').fill('carol');
    await page.getByLabel('Password').fill(CAROL.password);
    await create.click();
    await expect(page.getByText('This email is already registered')).toBeVisible();

    await page.getByLabel('Email').fill(CAROL.email);
    await create.click();
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('button', { name: 'Account menu for Carol Collector' }),
    ).toBeVisible();

    await signOutThroughUi(page);
    await page.goto('/login');
    await signInThroughUi(page, { ...CAROL, password: 'Wrong12345' });
    await expect(page.getByText('Invalid email or password.')).toBeVisible();

    await signInThroughUi(page, CAROL);
    await expect(
      page.getByRole('button', { name: 'Account menu for Carol Collector' }),
    ).toBeVisible();
  });

  test('sends guests to login and back to the protected page', async ({ page }) => {
    await openWithMocks(page, '/profile?scenario=default');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/);

    await signInThroughUi(page);
    await expect(page).toHaveURL('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  });

  test('recovers from an expired session by signing in again', async ({ page }) => {
    await startSignedIn(page, 'default', '/profile');
    await expect(page.getByLabel('Bio')).not.toBeEmpty();
    await page.evaluate(() => window.__mocks?.expireSessions());

    await page.getByLabel('Bio').fill('Updated after a long break.');
    await page.getByRole('button', { name: 'Save profile' }).click();

    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile&reason=expired/);
    await expect(
      page.getByRole('status').filter({ hasText: 'Your session expired' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^Account menu for / })).toBeHidden();

    await signInThroughUi(page);
    await expect(page).toHaveURL('/profile');
  });

  test('switches users without leaking private data', async ({ page }) => {
    await startSignedIn(page);
    await addToCart(page, 'nft_002');
    const cartLink = (count: string) => page.getByRole('link', { name: `Cart, ${count}` });
    await expect(cartLink('1 item')).toBeVisible();

    await signOutThroughUi(page);
    await expect(cartLink('0 items')).toBeVisible();

    await page.goto('/login?redirect=%2Fprofile');
    await signInThroughUi(page, BOB);
    await expect(page.getByLabel('Username')).toHaveValue('bob');
    await expect(cartLink('0 items')).toBeVisible();

    await signOutThroughUi(page);
    await page.goto('/login?redirect=%2Fcart');
    await signInThroughUi(page);
    await expect(cartLink('1 item')).toBeVisible();
  });
});
