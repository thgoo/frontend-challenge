import { expect, type Page, test } from '@playwright/test';
import { addToCart, signInThroughUi } from './support/flows';
import { openWithMocks, reloadWithMocks } from './support/mock-api';

function summary(page: Page) {
  return page.getByRole('complementary', { name: 'Resumo da carteira' });
}

function ethOf(page: Page, label: string) {
  return summary(page)
    .locator('div', { has: page.getByText(label, { exact: true }) })
    .locator('[data-eth]')
    .last()
    .getAttribute('data-eth');
}

function lineNames(page: Page) {
  return page.getByRole('region', { name: 'Itens' }).getByRole('listitem').getByRole('link');
}

test.describe('cart', () => {
  test('edits quantities, removes items and applies coupons', async ({ page }) => {
    await openWithMocks(page, '/login?scenario=default');
    await addToCart(page, 'nft_002');
    await addToCart(page, 'nft_006');
    await page.goto('/cart');
    await expect(lineNames(page)).toHaveCount(2);

    const [first, second] = await lineNames(page).allTextContents();
    const stepper = page.getByRole('group', { name: `Quantidade de ${first}` });
    const subtotal = await ethOf(page, 'Subtotal');
    await stepper.getByRole('button', { name: 'Aumentar quantidade' }).click();
    await expect(stepper.getByRole('status')).toHaveText('2');
    await expect.poll(() => ethOf(page, 'Subtotal')).not.toBe(subtotal);

    const coupon = page.getByLabel('Código promocional');
    const apply = page.getByRole('button', { name: 'Aplicar' });
    await coupon.fill('NOPE');
    await apply.click();
    await expect(page.getByText('Cupom inválido')).toBeVisible();
    await expect(coupon).toHaveAttribute('aria-invalid', 'true');
    await coupon.fill('SUMMER20');
    await apply.click();
    await expect(page.getByText('Este cupom expirou')).toBeVisible();
    await coupon.fill('WELCOME10');
    await apply.click();
    await expect(summary(page).getByText('Desconto (WELCOME10)')).toBeVisible();

    await page.getByRole('button', { name: new RegExp(`^Remover ${second} `) }).click();
    await expect(lineNames(page)).toHaveText([first]);

    await summary(page).getByRole('button', { name: 'Remover cupom' }).click();
    await expect(summary(page).getByText('Desconto (WELCOME10)')).toBeHidden();
  });

  test('keeps the guest cart after a refresh and merges it on login', async ({ page }) => {
    await openWithMocks(page, '/login?scenario=default');
    await addToCart(page, 'nft_002');
    await page.goto('/cart');
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
    // Wait for the server's answer: a reload would cancel the request still in flight.
    await expect(
      page.getByRole('group', { name: /^Quantidade de / }).getByRole('status'),
    ).toHaveText('2');
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeEnabled();
    await page.getByLabel('Código promocional').fill('WELCOME10');
    await page.getByRole('button', { name: 'Aplicar' }).click();
    await expect(summary(page).getByText('Desconto (WELCOME10)')).toBeVisible();

    await reloadWithMocks(page);
    await expect(
      page.getByRole('group', { name: /^Quantidade de / }).getByRole('status'),
    ).toHaveText('2');
    await expect(summary(page).getByText('Desconto (WELCOME10)')).toBeVisible();

    await page.goto('/login?redirect=%2Fcart');
    await signInThroughUi(page);
    await expect(page).toHaveURL('/cart');
    await expect(
      page.getByRole('group', { name: /^Quantidade de / }).getByRole('status'),
    ).toHaveText('2');
    await expect(summary(page).getByText('Desconto (WELCOME10)')).toBeVisible();
  });

  test('shows the cart count in the main navigation', async ({ page }) => {
    await openWithMocks(page, '/login?scenario=default');
    await addToCart(page, 'nft_002');
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Carrinho, 1 item' })).toBeVisible();
  });

  test('empties the cart', async ({ page }) => {
    await openWithMocks(page, '/login?scenario=default');
    await addToCart(page, 'nft_002');
    await page.goto('/cart');
    await page.getByRole('button', { name: /^Remover .* do carrinho$/ }).click();
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
  });
});
