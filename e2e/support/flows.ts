import { expect, type Locator, type Page } from '@playwright/test';
import { ALICE, openWithMocks } from './mock-api';

export async function signInThroughUi(page: Page, credentials = ALICE) {
  await page.getByLabel('E-mail', { exact: true }).fill(credentials.email);
  await page.getByLabel('Senha', { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

export async function startSignedIn(page: Page, scenario = 'default', path = '/') {
  await openWithMocks(page, `/login?scenario=${scenario}&redirect=${encodeURIComponent(path)}`);
  await signInThroughUi(page);
  await page.waitForURL((url) => url.pathname === path && !url.searchParams.has('auth'));
}

/** "Comprar" adds the selected edition and opens the cart. */
export async function addToCart(page: Page, nftId: string) {
  await page.goto(`/nfts/${nftId}`);
  await page.getByRole('button', { name: /^comprar/i }).click();
  await page.waitForURL('/cart');
}

/** Opens the single-page checkout and waits for the quote that enables confirmation. */
export async function openCheckout(page: Page) {
  await page.goto('/checkout');
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled();
}

/** Edits catalog filters in the sidebar (desktop) or the drawer (mobile), closing the drawer after. */
export async function editCatalogFilters(page: Page, edit: (panel: Locator) => Promise<void>) {
  const drawerTrigger = page.getByRole('button', { name: /^Filtros/ });
  const sidebar = page.getByRole('region', { name: 'Filtros' });
  await expect(drawerTrigger.or(sidebar)).toBeVisible();
  if (!(await drawerTrigger.isVisible())) {
    await edit(sidebar);
    return;
  }
  await drawerTrigger.click();
  const drawer = page.getByRole('dialog', { name: 'Filtros' });
  await edit(drawer);
  // A select inside the drawer may still be closing and swallow the first Escape.
  await expect(async () => {
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden({ timeout: 1000 });
  }).toPass();
}

/** Sorting sits in the toolbar on desktop and in the filters drawer on mobile, as in the Figma. */
export async function withSortSelect(page: Page, act: (select: Locator) => Promise<void>) {
  const inline = page.getByRole('combobox', { name: /Ordenar por/ });
  await expect(inline.or(page.getByRole('button', { name: /^Filtros/ }))).toBeVisible();
  if (await inline.isVisible()) {
    await act(inline);
    return;
  }
  await editCatalogFilters(page, (drawer) =>
    act(drawer.getByRole('combobox', { name: /Ordenar por/ })),
  );
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
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
  }
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible();
}
