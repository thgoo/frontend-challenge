import { expect, test } from '@playwright/test';
import { reloadWithMocks } from './support/mock-api';
import { startSignedIn } from './support/flows';

test.describe('account', () => {
  test('edits the profile, rejects a taken username and keeps changes after refresh', async ({
    page,
  }) => {
    await startSignedIn(page, 'default', '/profile');
    const details = page.getByRole('region', { name: 'Details' });

    await details.getByLabel('Username').fill('bob');
    await details.getByRole('button', { name: 'Save profile' }).click();
    await expect(details.getByText('Este nome de usuário já está em uso')).toBeVisible();
    await expect(details.getByLabel('Username')).toHaveAttribute('aria-invalid', 'true');

    await details.getByLabel('Username').fill('alice_collector');
    await details.getByLabel('Bio').fill('Collector of generative art and music.');
    await details.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Profile updated.')).toBeVisible();

    await reloadWithMocks(page);
    await expect(details.getByLabel('Username')).toHaveValue('alice_collector');
  });

  test('uploads an avatar and validates the file type', async ({ page }) => {
    await startSignedIn(page, 'default', '/profile');
    const input = page.getByLabel('Change avatar');

    await input.setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello'),
    });
    await expect(page.getByText('Use uma imagem PNG, JPEG ou WebP')).toBeVisible();

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    await input.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png });
    await expect(page.getByText('Avatar updated.')).toBeVisible();
    await expect(page.getByRole('img', { name: "Alice Collector's avatar" })).toBeVisible();
  });

  test('changes the password and validates the current one', async ({ page }) => {
    await startSignedIn(page, 'default', '/profile');
    const form = page.getByRole('region', { name: 'Password' });

    await form.getByLabel('Current password').fill('Wrong12345');
    await form.getByLabel('New password', { exact: true }).fill('NewPassword1');
    await form.getByLabel('Confirm new password').fill('Mismatch1');
    await form.getByRole('button', { name: 'Change password' }).click();
    await expect(form.getByText('As senhas não coincidem')).toBeVisible();

    await form.getByLabel('Confirm new password').fill('NewPassword1');
    await form.getByRole('button', { name: 'Change password' }).click();
    await expect(form.getByText('Senha atual incorreta')).toBeVisible();

    await form.getByLabel('Current password').fill('Password123');
    await form.getByRole('button', { name: 'Change password' }).click();
    await expect(page.getByText('Password changed.')).toBeVisible();
  });

  test('edits wallets and rejects an invalid or duplicated address', async ({ page }) => {
    await startSignedIn(page, 'default', '/wallets');
    const secondary = page.getByRole('form', { name: 'Secondary wallet' });

    await secondary.getByLabel('Address').fill('not-an-address');
    await secondary.getByRole('button', { name: 'Save changes' }).click();
    await expect(secondary.getByText('Informe um endereço 0x válido')).toBeVisible();

    await secondary.getByLabel('Address').fill('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
    await secondary.getByRole('button', { name: 'Save changes' }).click();
    await expect(secondary.getByText('Endereço já usado na sua outra carteira')).toBeVisible();

    await secondary.getByLabel('Label').fill('Cold storage');
    await secondary.getByLabel('Address').fill(`0x${'b'.repeat(40)}`);
    await secondary.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Secondary wallet saved.')).toBeVisible();

    await reloadWithMocks(page);
    await expect(secondary.getByLabel('Label')).toHaveValue('Cold storage');
  });
});
