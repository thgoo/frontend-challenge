import { expect, type Page } from '@playwright/test';
import { ALICE, openWithMocks } from './mock-api';

export async function signInThroughUi(page: Page, credentials = ALICE) {
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function startSignedIn(page: Page, scenario = 'default', path = '/') {
  await openWithMocks(page, `/login?scenario=${scenario}&redirect=${encodeURIComponent(path)}`);
  await signInThroughUi(page);
  await page.waitForURL((url) => url.pathname === path);
}

export async function addToCart(page: Page, nftId: string) {
  await page.goto(`/nfts/${nftId}`);
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByText(/Added \d+ ×/)).toBeVisible();
}

export async function reachReview(page: Page) {
  await page.goto('/checkout');
  await page.getByLabel('Country').fill('Brazil');
  await page.getByRole('button', { name: /^Connect / }).click();
  await expect(page.getByText(/^Connected to /)).toBeVisible();
  await page.getByRole('button', { name: 'Review order' }).click();
  await expect(page.getByRole('heading', { name: 'Review your order' })).toBeVisible();
}
