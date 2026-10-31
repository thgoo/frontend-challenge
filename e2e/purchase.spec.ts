import { expect, test } from '@playwright/test';
import { addToCart, openCheckout, startSignedIn } from './support/flows';

/** Default scenario: the payment settles 3 s after the order is placed. */
const SETTLEMENT = 3000;

test('buys an NFT from the catalog to a confirmed receipt', async ({ page }) => {
  await page.clock.install();
  await startSignedIn(page);
  const name = 'Sage Nomad #009';
  await page
    .getByRole('region', { name: 'Mercado' })
    .getByRole('article')
    .getByRole('link', { name })
    .click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();

  await addToCart(page, 'nft_002');
  await page.goto('/cart');
  await expect(page.getByRole('link', { name })).toBeVisible();

  await openCheckout(page);
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await expect(
    page.getByRole('heading', { name: 'Aguardando confirmação do pagamento' }),
  ).toBeVisible();
  await page.clock.fastForward(SETTLEMENT);
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /^Ver no Etherscan/ })).toHaveAttribute(
    'href',
    /0x[0-9a-f]{64}$/,
  );

  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
});
