import { expect, test } from '@playwright/test';
import { ALICE as alice, api, openWithMocks as open, reloadWithMocks } from './support/mock-api';

/** An unknown path renders the not-found page, which calls no API besides the session. */
const QUIET_PAGE = '/mock-api';

test.describe('mock api', () => {
  test('re-activates mocking when returning to the tab after the worker was stopped', async ({
    page,
  }) => {
    await open(page, '/?scenario=default');
    const devtools = await page.context().newCDPSession(page);
    await devtools.send('ServiceWorker.enable');
    await devtools.send('ServiceWorker.stopAllWorkers');
    // The restarted worker no longer knows this tab, so requests reach the (absent) network API.
    // Stopping is asynchronous: wait until requests really stop being mocked.
    await expect.poll(async () => (await api(page, '/nfts/nft_001')).status).not.toBe(200);

    const reactivated = await page.evaluate(async () => {
      const confirmation = new Promise<boolean>((resolve) => {
        navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
          if ((event.data as { type?: string } | null)?.type === 'MOCKING_ENABLED') resolve(true);
        });
        setTimeout(() => {
          resolve(false);
        }, 2000);
      });
      document.dispatchEvent(new Event('visibilitychange', { bubbles: true }));
      return confirmation;
    });

    expect(reactivated).toBe(true);
    expect((await api(page, '/nfts/nft_001')).status).toBe(200);
  });

  test('lists, filters and fetches NFTs', async ({ page }) => {
    await open(page, `${QUIET_PAGE}?scenario=default`);
    const list = await api(page, '/nfts?categories=digital-art&sort=price-asc&page=1');
    expect(list.status).toBe(200);
    expect(list.body).toMatchObject({ page: 1, pageSize: 9 });

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
    await open(page, `${QUIET_PAGE}?scenario=default`);
    expect(await api(page, '/auth/session')).toEqual({ status: 200, body: null });
    expect(
      await api(page, '/auth/login', {
        method: 'POST',
        body: { ...alice, password: 'wrong-pass1' },
      }),
    ).toMatchObject({
      status: 401,
    });

    expect((await api(page, '/auth/login', { method: 'POST', body: alice })).status).toBe(200);
    await reloadWithMocks(page);
    expect(await api(page, '/auth/session')).toMatchObject({
      status: 200,
      body: { user: { email: alice.email } },
    });

    expect((await api(page, '/auth/logout', { method: 'POST' })).status).toBe(204);
    expect(await api(page, '/auth/session')).toEqual({ status: 200, body: null });
  });

  test('reports registration conflicts and validation errors per field', async ({ page }) => {
    await open(page, `${QUIET_PAGE}?scenario=default`);
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
    await open(page, `${QUIET_PAGE}?scenario=default`);
    await api(page, '/auth/login', { method: 'POST', body: alice });
    await page.evaluate(() => window.__mocks?.expireSessions());
    expect(await api(page, '/favorites')).toMatchObject({
      status: 401,
      body: { code: 'SESSION_EXPIRED' },
    });
    expect(await api(page, '/auth/session')).toEqual({ status: 200, body: null });
  });

  test('persists registered users until the scenario is reset', async ({ page }) => {
    await open(page, `${QUIET_PAGE}?scenario=default`);
    const carol = {
      name: 'Carol',
      username: 'carol',
      email: 'carol@example.com',
      password: 'Password123',
    };
    expect((await api(page, '/auth/register', { method: 'POST', body: carol })).status).toBe(201);

    await reloadWithMocks(page);
    expect((await api(page, '/auth/login', { method: 'POST', body: carol })).status).toBe(200);

    await open(page, `${QUIET_PAGE}?reset`);
    expect((await api(page, '/auth/login', { method: 'POST', body: carol })).status).toBe(401);
    await expect(page).toHaveURL(QUIET_PAGE);
  });

  test('simulates transient failures that recover', async ({ page }) => {
    await open(page, `${QUIET_PAGE}?scenario=flaky`);
    const statuses = [];
    for (let attempt = 0; attempt < 4; attempt += 1)
      statuses.push((await api(page, '/nfts')).status);
    expect(statuses).toEqual([503, 503, 503, 200]);
  });

  test('simulates an offline network and an empty catalog', async ({ page }) => {
    await open(page, `${QUIET_PAGE}?scenario=offline`);
    expect((await api(page, '/nfts')).status).toBe(0);

    await open(page, `${QUIET_PAGE}?scenario=empty`);
    expect(await api(page, '/nfts')).toMatchObject({ status: 200, body: { total: 0, items: [] } });
  });
});
