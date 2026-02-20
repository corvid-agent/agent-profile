import { test, expect } from '@playwright/test';

// Mock all external API calls to prevent flaky tests
async function mockAPIs(page: import('@playwright/test').Page) {
  // Mock GitHub repos API
  await page.route('**/api.github.com/users/corvid-agent/repos*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          name: 'agent-profile',
          html_url: 'https://github.com/corvid-agent/agent-profile',
          description: 'Public agent profile page',
          language: 'HTML',
          stargazers_count: 2,
          fork: false,
          pushed_at: '2025-01-15T00:00:00Z',
        },
        {
          name: 'corvid-agent-chat',
          html_url: 'https://github.com/corvid-agent/corvid-agent-chat',
          description: 'Encrypted on-chain messaging',
          language: 'TypeScript',
          stargazers_count: 5,
          fork: false,
          pushed_at: '2025-01-14T00:00:00Z',
        },
      ]),
    })
  );

  // Mock GitHub events API
  await page.route('**/api.github.com/users/corvid-agent/events/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          type: 'PushEvent',
          repo: { name: 'corvid-agent/agent-profile' },
          payload: { commits: [{ sha: 'abc123' }] },
          created_at: new Date().toISOString(),
        },
        {
          type: 'CreateEvent',
          repo: { name: 'corvid-agent/corvid-agent-chat' },
          payload: { ref_type: 'branch' },
          created_at: new Date().toISOString(),
        },
      ]),
    })
  );

  // Mock Algorand account API
  await page.route('**/mainnet-api.4160.nodely.dev/v2/accounts/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        amount: 12345678,
        'min-balance': 100000,
        assets: [{ 'asset-id': 1 }, { 'asset-id': 2 }],
        'apps-local-state': [{ id: 1 }],
        'created-apps': [{ id: 100 }, { id: 101 }],
      }),
    })
  );

  // Mock Algorand transactions API
  await page.route('**/mainnet-idx.4160.nodely.dev/v2/accounts/*/transactions*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        transactions: [
          {
            id: 'TXID1',
            sender: 'WGSHC4TYKYBS6EX5V5E377BQDLKWIIPBCFOLZQZIXCKHFIEKRPBFOMW25A',
            'payment-transaction': {
              amount: 500000,
              receiver: 'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12',
            },
            'round-time': Math.floor(Date.now() / 1000) - 3600,
          },
          {
            id: 'TXID2',
            sender: 'XYZABC1234567890XYZABC1234567890XYZABC1234567890XYZABC12',
            'payment-transaction': {
              amount: 1000000,
              receiver: 'WGSHC4TYKYBS6EX5V5E377BQDLKWIIPBCFOLZQZIXCKHFIEKRPBFOMW25A',
            },
            'round-time': Math.floor(Date.now() / 1000) - 7200,
          },
        ],
      }),
    })
  );
}

test.describe('App loading and structure', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle('corvid-agent | Agent Profile');
  });

  test('meta description is present', async ({ page }) => {
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute(
      'content',
      /on-chain identity.*corvid-agent/i
    );
  });

  test('page has correct Open Graph meta tags', async ({ page }) => {
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /corvid-agent/
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'profile'
    );
  });

  test('structured data (JSON-LD) is present', async ({ page }) => {
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toBeAttached();
    const content = await jsonLd.textContent();
    const parsed = JSON.parse(content!);
    expect(parsed['@type']).toBe('ProfilePage');
    expect(parsed.mainEntity.name).toBe('corvid-agent');
  });

  test('background canvas exists', async ({ page }) => {
    await expect(page.locator('canvas#bg-canvas')).toBeAttached();
  });

  test('noscript fallback is present', async ({ page }) => {
    const noscript = page.locator('noscript');
    await expect(noscript).toBeAttached();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('nav bar is visible with logo', async ({ page }) => {
    const nav = page.locator('nav.nav');
    await expect(nav).toBeVisible();
    const logo = nav.locator('.nav-logo span');
    await expect(logo).toHaveText('corvid-agent');
  });

  test('nav contains expected links', async ({ page }) => {
    const navLinks = page.locator('.nav-links a');
    const texts = await navLinks.allTextContents();
    expect(texts).toContain('Home');
    expect(texts).toContain('Profile');
    expect(texts).toContain('Dashboard');
    expect(texts).toContain('Explorer');
    expect(texts).toContain('Chat');
    expect(texts).toContain('GitHub');
  });

  test('Profile link is visually highlighted', async ({ page }) => {
    const profileLink = page.locator('.nav-links a', { hasText: 'Profile' });
    const style = await profileLink.getAttribute('style');
    expect(style).toContain('var(--text-bright)');
  });

  test('GitHub link points to correct URL', async ({ page }) => {
    const ghLink = page.locator('.nav-links a', { hasText: 'GitHub' });
    await expect(ghLink).toHaveAttribute('href', 'https://github.com/corvid-agent');
  });

  test('nav is sticky at top of page', async ({ page }) => {
    const nav = page.locator('nav.nav');
    const position = await nav.evaluate(el => getComputedStyle(el).position);
    expect(position).toBe('sticky');
  });
});

test.describe('Footer', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('footer is visible', async ({ page }) => {
    const footer = page.locator('footer.footer');
    await expect(footer).toBeVisible();
  });

  test('footer contains attribution text', async ({ page }) => {
    const footerText = page.locator('.footer-text');
    await expect(footerText).toContainText('corvid-agent');
    await expect(footerText).toContainText('Algorand');
    await expect(footerText).toContainText('CorvidLabs');
  });

  test('footer contains navigation links', async ({ page }) => {
    const footerLinks = page.locator('footer.footer a');
    const count = await footerLinks.count();
    // Footer has nav links (Home, Profile, Dashboard, etc.) + attribution links
    expect(count).toBeGreaterThanOrEqual(10);
  });
});
