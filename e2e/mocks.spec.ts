import { expect, test, type Page } from '@playwright/test';
import type {} from '../src/mocks/control-api';

async function api(page: Page, path: string, init?: { method?: string; body?: unknown }) {
  return page.evaluate(
    async ({ path, init }) => {
      try {
        const response = await fetch(`/api${path}`, {
          method: init?.method ?? 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: init?.body === undefined ? undefined : JSON.stringify(init.body),
        });
        const text = await response.text();
        return { status: response.status, body: text ? (JSON.parse(text) as unknown) : null };
      } catch {
        return { status: 0, body: null };
      }
    },
    { path, init },
  );
}

async function open(page: Page, url: string) {
  await page.goto(url);
  await page.waitForFunction(() => window.__mocks !== undefined);
}

const alice = { email: 'alice@example.com', password: 'Password123' };

test.describe('mock api', () => {
  test('lists, filters and fetches NFTs', async ({ page }) => {
    await open(page, '/?scenario=default');
    const list = await api(page, '/nfts?categories=art&sort=price-asc&page=1');
    expect(list.status).toBe(200);
    expect(list.body).toMatchObject({ page: 1, pageSize: 12 });

    expect((await api(page, '/nfts/nft_001')).status).toBe(200);
    expect(await api(page, '/nfts/nft_999')).toMatchObject({
      status: 404,
      body: { code: 'NOT_FOUND' },
    });
    expect(await api(page, '/nfts?page=0')).toMatchObject({
      status: 422,
      body: { code: 'VALIDATION_FAILED' },
    });
  });

  test('keeps the session in a cookie across reloads and clears it on logout', async ({ page }) => {
    await open(page, '/?scenario=default');
    expect((await api(page, '/auth/session')).status).toBe(401);
    expect(
      await api(page, '/auth/login', {
        method: 'POST',
        body: { ...alice, password: 'wrong-pass1' },
      }),
    ).toMatchObject({
      status: 401,
    });

    expect((await api(page, '/auth/login', { method: 'POST', body: alice })).status).toBe(200);
    await page.reload();
    await page.waitForFunction(() => window.__mocks !== undefined);
    expect(await api(page, '/auth/session')).toMatchObject({
      status: 200,
      body: { user: { email: alice.email } },
    });

    expect((await api(page, '/auth/logout', { method: 'POST' })).status).toBe(204);
    expect((await api(page, '/auth/session')).status).toBe(401);
  });

  test('reports registration conflicts and validation errors per field', async ({ page }) => {
    await open(page, '/?scenario=default');
    const conflict = await api(page, '/auth/register', {
      method: 'POST',
      body: { name: 'Alice', username: 'alice', email: alice.email, password: 'Password123' },
    });
    expect(conflict).toMatchObject({
      status: 409,
      body: {
        code: 'CONFLICT',
        fieldErrors: { email: expect.any(String), username: expect.any(String) },
      },
    });

    const invalid = await api(page, '/auth/register', {
      method: 'POST',
      body: { name: 'C', username: 'Carol!', email: 'nope', password: 'short' },
    });
    expect(invalid).toMatchObject({ status: 422, body: { code: 'VALIDATION_FAILED' } });
  });

  test('expires sessions on demand', async ({ page }) => {
    await open(page, '/?scenario=default');
    await api(page, '/auth/login', { method: 'POST', body: alice });
    await page.evaluate(() => window.__mocks?.expireSessions());
    expect(await api(page, '/auth/session')).toMatchObject({
      status: 401,
      body: { code: 'SESSION_EXPIRED' },
    });
  });

  test('persists registered users until the scenario is reset', async ({ page }) => {
    await open(page, '/?scenario=default');
    const carol = {
      name: 'Carol',
      username: 'carol',
      email: 'carol@example.com',
      password: 'Password123',
    };
    expect((await api(page, '/auth/register', { method: 'POST', body: carol })).status).toBe(201);

    await page.reload();
    await page.waitForFunction(() => window.__mocks !== undefined);
    expect((await api(page, '/auth/login', { method: 'POST', body: carol })).status).toBe(200);

    await open(page, '/?reset');
    expect((await api(page, '/auth/login', { method: 'POST', body: carol })).status).toBe(401);
    await expect(page).toHaveURL(/\/$/);
  });

  test('simulates transient failures that recover', async ({ page }) => {
    await open(page, '/?scenario=flaky');
    const statuses = [];
    for (let attempt = 0; attempt < 4; attempt += 1)
      statuses.push((await api(page, '/nfts')).status);
    expect(statuses).toEqual([503, 503, 503, 200]);
  });

  test('simulates an offline network and an empty catalog', async ({ page }) => {
    await open(page, '/?scenario=offline');
    expect((await api(page, '/nfts')).status).toBe(0);

    await open(page, '/?scenario=empty');
    expect(await api(page, '/nfts')).toMatchObject({ status: 200, body: { total: 0, items: [] } });
  });
});
