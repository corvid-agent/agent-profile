import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api.github.com/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/mainnet-api.algonode.cloud/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ amount: 5000000, assets: [] }) })
    );
  });

  test('should load page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Agent Profile/i);
  });

  test('should show profile name', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.profile-name')).toBeVisible();
  });

  test('should show avatar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.avatar-ring')).toBeVisible();
  });

  test('should show stats row', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.stats-row')).toBeVisible();
  });

  test('should show badges', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.profile-badges')).toBeVisible();
  });
});
