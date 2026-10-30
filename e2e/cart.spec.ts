import { expect, type Page, test } from '@playwright/test';
import { addToCart, signInThroughUi } from './support/flows';
import { openWithMocks, reloadWithMocks } from './support/mock-api';

function summary(page: Page) {
  return page.getByRole('complementary', { name: 'Order summary' });
}

function ethOf(page: Page, label: string) {
  return summary(page)
    .locator('div', { has: page.getByText(label, { exact: true }) })
    .locator('[data-eth]')
    .last()
    .getAttribute('data-eth');
}

function lineNames(page: Page) {
  return page.getByRole('region', { name: 'Items' }).getByRole('listitem').getByRole('link');
}

test.describe('cart', () => {
  test('edits quantities, removes items and applies coupons', async ({ page }) => {
    await openWithMocks(page, '/login?scenario=default');
    await addToCart(page, 'nft_002');
    await addToCart(page, 'nft_006');
    await page.goto('/cart');
    await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible();
    await expect(lineNames(page)).toHaveCount(2);

    const [first, second] = await lineNames(page).allTextContents();
    const stepper = page.getByRole('group', { name: `Quantity of ${first}` });
    const subtotal = await ethOf(page, 'Subtotal');
    await stepper.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(stepper.getByRole('status')).toHaveText('2');
    await expect(page.getByRole('link', { name: 'Cart, 3 items' })).toBeVisible();
    await expect.poll(() => ethOf(page, 'Subtotal')).not.toBe(subtotal);

    const coupon = page.getByLabel('Coupon code');
    const apply = page.getByRole('button', { name: 'Apply' });
    await coupon.fill('NOPE');
    await apply.click();
    await expect(page.getByText('Invalid coupon code')).toBeVisible();
    await expect(coupon).toHaveAttribute('aria-invalid', 'true');
    await coupon.fill('SUMMER20');
    await apply.click();
    await expect(page.getByText('This coupon has expired')).toBeVisible();
    await coupon.fill('WELCOME10');
    await apply.click();
    await expect(summary(page).getByText('Discount (WELCOME10)')).toBeVisible();

    await page.getByRole('button', { name: new RegExp(`^Remove ${second} `) }).click();
    await expect(lineNames(page)).toHaveText([first]);
    await expect(page.getByRole('link', { name: 'Cart, 2 items' })).toBeVisible();

    await summary(page).getByRole('button', { name: 'Remove' }).click();
    await expect(summary(page).getByText(/^Discount/)).toBeHidden();
  });

  test('keeps the guest cart after a refresh and merges it on login', async ({ page }) => {
    await openWithMocks(page, '/login?scenario=default');
    await addToCart(page, 'nft_002');
    await page.goto('/cart');
    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await page.getByLabel('Coupon code').fill('WELCOME10');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(summary(page).getByText('Discount (WELCOME10)')).toBeVisible();

    await reloadWithMocks(page);
    await expect(page.getByRole('group', { name: /^Quantity of / }).getByRole('status')).toHaveText(
      '2',
    );
    await expect(summary(page).getByText('Discount (WELCOME10)')).toBeVisible();

    await page.goto('/login?redirect=%2Fcart');
    await signInThroughUi(page);
    await expect(page).toHaveURL('/cart');
    await expect(page.getByRole('button', { name: /^Account menu for / })).toBeVisible();
    await expect(page.getByRole('group', { name: /^Quantity of / }).getByRole('status')).toHaveText(
      '2',
    );
    await expect(summary(page).getByText('Discount (WELCOME10)')).toBeVisible();
  });

  test('empties the cart', async ({ page }) => {
    await openWithMocks(page, '/login?scenario=default');
    await addToCart(page, 'nft_002');
    await page.goto('/cart');
    await page.getByRole('button', { name: /^Remove .* from cart$/ }).click();
    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  });
});
