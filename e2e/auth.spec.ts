import { expect, test } from '@playwright/test';
import {
  addToCart,
  signedInIndicator,
  signInThroughUi,
  signOutThroughUi,
  startSignedIn,
} from './support/flows';
import { BOB, openWithMocks } from './support/mock-api';

const CAROL = { email: 'carol@example.com', password: 'Password123' };

test.describe('auth', () => {
  test('registers with validation, signs out and signs back in', async ({ page }) => {
    await openWithMocks(page, '/register?scenario=default');
    const create = page.getByRole('button', { name: 'Criar conta', exact: true });
    const username = page.getByLabel('Nome de usuário');
    const email = page.getByLabel('E-mail', { exact: true });
    const password = page.getByLabel('Senha', { exact: true });
    const confirm = page.getByLabel('Confirmar senha');

    await create.click();
    await expect(username).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAttribute('aria-invalid', 'true');

    await username.fill('Carol!');
    await email.fill('alice@example.com');
    await password.fill('short');
    await confirm.fill('different');
    await create.click();
    await expect(page.getByText('Use de 3 a 20 letras minúsculas, números ou _')).toBeVisible();
    await expect(page.getByText('Use pelo menos 8 caracteres')).toBeVisible();
    await expect(page.getByText('As senhas não coincidem')).toBeVisible();

    await username.fill('carol');
    await password.fill(CAROL.password);
    await confirm.fill(CAROL.password);
    await create.click();
    await expect(page.getByText('Este e-mail já está cadastrado')).toBeVisible();

    await email.fill(CAROL.email);
    await create.click();
    await expect(page).toHaveURL('/');
    await expect(signedInIndicator(page, 'carol')).toBeVisible();

    await signOutThroughUi(page);
    await page.goto('/login');
    await signInThroughUi(page, { ...CAROL, password: 'Wrong12345' });
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible();

    await signInThroughUi(page, CAROL);
    await expect(signedInIndicator(page, 'carol')).toBeVisible();
  });

  test('sends guests to login and back to the protected page', async ({ page }) => {
    await openWithMocks(page, '/profile?scenario=default');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/);

    await signInThroughUi(page);
    await expect(page).toHaveURL('/profile');
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible();
  });

  test('recovers from an expired session by signing in again', async ({ page }) => {
    await startSignedIn(page, 'default', '/profile');
    await expect(page.getByLabel('Bio')).not.toBeEmpty();
    await page.evaluate(() => window.__mocks?.expireSessions());

    await page.getByLabel('Bio').fill('Updated after a long break.');
    await page.getByRole('button', { name: 'Salvar', exact: true }).click();

    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile&reason=expired/);
    await expect(page.getByRole('status').filter({ hasText: 'Sua sessão expirou' })).toBeVisible();
    await expect(signedInIndicator(page)).toBeHidden();

    await signInThroughUi(page);
    await expect(page).toHaveURL('/profile');
  });

  test('switches users without leaking private data', async ({ page }) => {
    const cartLines = page.getByRole('group', { name: /^Quantidade de / });
    await startSignedIn(page);
    await addToCart(page, 'nft_002');
    await page.goto('/cart');
    await expect(cartLines).toHaveCount(1);

    await signOutThroughUi(page);
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();

    await page.goto('/login?redirect=%2Fprofile');
    await signInThroughUi(page, BOB);
    await expect(page.getByLabel('Nome de usuário')).toHaveValue('bob');
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();

    await signOutThroughUi(page);
    await page.goto('/login?redirect=%2Fcart');
    await signInThroughUi(page);
    await expect(cartLines).toHaveCount(1);
  });
});
