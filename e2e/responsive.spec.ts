import { expect, type Page, test } from '@playwright/test';
import { startSignedIn } from './support/flows';
import { api } from './support/mock-api';

/** 320 is 1280 at 400% zoom; 1024–1152 covers small laptops and 1440 at 125% zoom. */
const WIDTHS = [320, 768, 1024, 1152];
const PAGES = ['/', '/nfts/nft_001', '/cart', '/checkout', '/profile', '/wallets', '/favorites'];

async function expectNoHorizontalOverflow(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

test.describe('responsive layout', () => {
  test.skip(({ isMobile }) => isMobile, 'Sets its own viewport widths');

  for (const width of WIDTHS) {
    test(`has no horizontal overflow at ${String(width)} pixels`, async ({ page }) => {
      await startSignedIn(page);
      await api(page, '/cart/items', {
        method: 'POST',
        body: { nftId: 'nft_001', editionId: 'ed_001_1', quantity: 1 },
      });
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await test.step(path, async () => {
          await page.goto(path);
          await expectNoHorizontalOverflow(page);
        });
      }
    });
  }
});
