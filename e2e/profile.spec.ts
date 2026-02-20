import { test, expect } from '@playwright/test';

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api.github.com/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/mainnet-api.algonode.cloud/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ amount: 5000000, assets: [] }) })
    );
  });

  test('should show identity cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.card').first()).toBeVisible();
  });

  test('should show background canvas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#bg-canvas')).toBeVisible();
  });

  test('should show repos list', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#repos-list')).toBeAttached();
  });

  test('should show contribution graph', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#contrib-graph')).toBeAttached();
  });
});
