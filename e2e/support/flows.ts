import { expect, type Locator, type Page } from '@playwright/test';
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

/** Edits catalog filters in the sidebar (desktop) or the drawer (mobile), closing the drawer after. */
export async function editCatalogFilters(page: Page, edit: (panel: Locator) => Promise<void>) {
  const drawerTrigger = page.getByRole('button', { name: /^Filtros/ });
  if (!(await drawerTrigger.isVisible())) {
    await edit(page.getByRole('region', { name: 'Filtros' }));
    return;
  }
  await drawerTrigger.click();
  const drawer = page.getByRole('dialog', { name: 'Filtros' });
  await edit(drawer);
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
}

/** Mobile searches from the bar above the catalog; desktop from the header search dialog. */
export async function searchCatalog(page: Page, term: string) {
  const inline = page.getByRole('searchbox', { name: 'Buscar NFTs' });
  if (await inline.isVisible()) {
    await inline.fill(term);
    return;
  }
  await page.getByRole('button', { name: 'Buscar NFTs' }).click();
  const dialog = page.getByRole('dialog', { name: 'Buscar NFTs' });
  await dialog.getByRole('searchbox', { name: 'Buscar NFTs' }).fill(term);
  await dialog.getByRole('button', { name: 'Buscar' }).click();
}

/** Desktop shows the account menu in the header; mobile shows "Perfil de …" in the tab bar. */
export function signedInIndicator(page: Page, name?: string) {
  const desktop = name ? `Menu da conta de ${name}` : /^Menu da conta de /;
  const mobile = name ? `Perfil de ${name}` : /^Perfil de /;
  return page.getByRole('button', { name: desktop }).or(page.getByRole('link', { name: mobile }));
}

export async function signOutThroughUi(page: Page) {
  const menu = page.getByRole('button', { name: /^Menu da conta de / });
  if (await menu.isVisible()) {
    await menu.click();
    await page.getByRole('menuitem', { name: 'Sair' }).click();
  } else {
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Sair da conta' }).click();
  }
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible();
}
