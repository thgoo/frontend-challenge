import type { Page } from '@playwright/test';
import type {} from '../../src/mocks/control-api';

export interface ApiCall {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface ApiResult<T = unknown> {
  status: number;
  body: T;
}

/** Calls the mocked API from inside the page, so requests go through the MSW service worker. */
export async function api<T = unknown>(
  page: Page,
  path: string,
  call: ApiCall = {},
): Promise<ApiResult<T>> {
  return page.evaluate(
    async ({ path, call }) => {
      try {
        const response = await fetch(`/api${path}`, {
          method: call.method ?? 'GET',
          headers: { 'Content-Type': 'application/json', ...call.headers },
          body: call.body === undefined ? undefined : JSON.stringify(call.body),
          signal: call.timeoutMs ? AbortSignal.timeout(call.timeoutMs) : undefined,
        });
        const text = await response.text();
        return { status: response.status, body: text ? (JSON.parse(text) as T) : (null as T) };
      } catch {
        return { status: 0, body: null as T };
      }
    },
    { path, call },
  );
}

export async function openWithMocks(page: Page, url: string) {
  await page.goto(url);
  await page.waitForFunction(() => window.__mocks !== undefined);
}

export async function reloadWithMocks(page: Page) {
  await page.reload();
  await page.waitForFunction(() => window.__mocks !== undefined);
}

export const ALICE = { email: 'alice@example.com', password: 'Password123' };
export const BOB = { email: 'bob@example.com', password: 'Password123' };

export async function login(page: Page, credentials: { email: string; password: string }) {
  const result = await api(page, '/auth/login', { method: 'POST', body: credentials });
  if (result.status !== 200) throw new Error(`Login failed with ${result.status}`);
}

export async function waitForSocket(page: Page) {
  await page.waitForFunction(() => (window.__mocks?.sockets.connectionCount() ?? 0) > 0);
}

export async function updateEdition(
  page: Page,
  editionRef: { nftId: string; editionId: string },
  patch: { priceEth?: string; available?: number },
) {
  await page.evaluate(
    ({ editionRef, patch }) =>
      window.__mocks?.updateEdition(editionRef.nftId, editionRef.editionId, patch),
    { editionRef, patch },
  );
}
