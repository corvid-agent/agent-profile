import { test, expect } from '@playwright/test';

const WALLET = 'WGSHC4TYKYBS6EX5V5E377BQDLKWIIPBCFOLZQZIXCKHFIEKRPBFOMW25A';

const MOCK_REPOS = [
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
  {
    name: 'algo-explorer',
    html_url: 'https://github.com/corvid-agent/algo-explorer',
    description: 'Algorand block explorer',
    language: 'JavaScript',
    stargazers_count: 0,
    fork: false,
    pushed_at: '2025-01-13T00:00:00Z',
  },
  {
    name: 'forked-repo',
    html_url: 'https://github.com/corvid-agent/forked-repo',
    description: 'A forked repo',
    language: 'Python',
    stargazers_count: 0,
    fork: true,
    pushed_at: '2025-01-10T00:00:00Z',
  },
];

const MOCK_EVENTS = [
  {
    type: 'PushEvent',
    repo: { name: 'corvid-agent/agent-profile' },
    payload: { commits: [{ sha: 'abc123' }, { sha: 'def456' }] },
    created_at: new Date().toISOString(),
  },
  {
    type: 'CreateEvent',
    repo: { name: 'corvid-agent/corvid-agent-chat' },
    payload: { ref_type: 'branch' },
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    type: 'PullRequestEvent',
    repo: { name: 'corvid-agent/algo-explorer' },
    payload: { action: 'opened' },
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

const MOCK_ALGO_ACCOUNT = {
  amount: 12345678,
  'min-balance': 100000,
  assets: [{ 'asset-id': 1 }, { 'asset-id': 2 }],
  'apps-local-state': [{ id: 1 }],
  'created-apps': [{ id: 100 }, { id: 101 }],
};

const MOCK_TRANSACTIONS = {
  transactions: [
    {
      id: 'TXID_SEND_1',
      sender: WALLET,
      'payment-transaction': {
        amount: 500000,
        receiver: 'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12',
      },
      'round-time': Math.floor(Date.now() / 1000) - 3600,
    },
    {
      id: 'TXID_RECV_1',
      sender: 'XYZABC1234567890XYZABC1234567890XYZABC1234567890XYZABC12',
      'payment-transaction': {
        amount: 1000000,
        receiver: WALLET,
      },
      'round-time': Math.floor(Date.now() / 1000) - 7200,
    },
    {
      id: 'TXID_APP_1',
      sender: WALLET,
      'application-transaction': { 'application-id': 123 },
      'round-time': Math.floor(Date.now() / 1000) - 10800,
    },
  ],
};

async function mockAPIs(page: import('@playwright/test').Page) {
  await page.route('**/api.github.com/users/corvid-agent/repos*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_REPOS),
    })
  );

  await page.route('**/api.github.com/users/corvid-agent/events/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_EVENTS),
    })
  );

  await page.route('**/mainnet-api.4160.nodely.dev/v2/accounts/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ALGO_ACCOUNT),
    })
  );

  await page.route('**/mainnet-idx.4160.nodely.dev/v2/accounts/*/transactions*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TRANSACTIONS),
    })
  );
}

test.describe('Profile card', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('avatar ring is visible', async ({ page }) => {
    await expect(page.locator('.avatar-ring')).toBeVisible();
    await expect(page.locator('.avatar-inner')).toBeVisible();
  });

  test('profile name displays corvid-agent', async ({ page }) => {
    const name = page.locator('h1.profile-name');
    await expect(name).toBeVisible();
    await expect(name).toContainText('corvid-agent');
  });

  test('profile name has gradient styling', async ({ page }) => {
    const gradient = page.locator('h1.profile-name .gradient');
    await expect(gradient).toBeVisible();
    await expect(gradient).toHaveText('corvid-agent');
  });

  test('tagline is displayed', async ({ page }) => {
    const tagline = page.locator('.profile-tagline');
    await expect(tagline).toBeVisible();
    await expect(tagline).toContainText('Autonomous AI agent');
    await expect(tagline).toContainText('Algorand');
  });
});

test.describe('Profile badges', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('Online badge is displayed with green dot', async ({ page }) => {
    const onlineBadge = page.locator('.badge-online');
    await expect(onlineBadge).toBeVisible();
    await expect(onlineBadge).toContainText('Online');
    await expect(onlineBadge.locator('.badge-dot.green')).toBeVisible();
  });

  test('Algorand Mainnet badge is displayed', async ({ page }) => {
    const chainBadge = page.locator('.badge-chain');
    await expect(chainBadge).toBeVisible();
    await expect(chainBadge).toHaveText('Algorand Mainnet');
  });

  test('Claude-powered badge is displayed', async ({ page }) => {
    const aiBadge = page.locator('.badge-ai');
    await expect(aiBadge).toBeVisible();
    await expect(aiBadge).toHaveText('Claude-powered');
  });
});

test.describe('Profile links', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('GitHub profile link is present', async ({ page }) => {
    const ghLink = page.locator('.profile-links .profile-link', { hasText: 'GitHub' });
    await expect(ghLink).toBeVisible();
    await expect(ghLink).toHaveAttribute('href', 'https://github.com/corvid-agent');
    await expect(ghLink).toHaveAttribute('target', '_blank');
  });

  test('Explorer link is present', async ({ page }) => {
    const link = page.locator('.profile-links .profile-link', { hasText: 'Explorer' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /algo-explorer/);
  });

  test('AlgoChat link is present', async ({ page }) => {
    const link = page.locator('.profile-links .profile-link', { hasText: 'AlgoChat' });
    await expect(link).toBeVisible();
  });

  test('Dashboard link is present', async ({ page }) => {
    const link = page.locator('.profile-links .profile-link', { hasText: 'Dashboard' });
    await expect(link).toBeVisible();
  });

  test('CorvidLabs link is present', async ({ page }) => {
    const link = page.locator('.profile-links .profile-link', { hasText: 'CorvidLabs' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://github.com/CorvidLabs');
  });
});

test.describe('Live stats', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('stats row is visible with four stat boxes', async ({ page }) => {
    const statBoxes = page.locator('.stat-box');
    await expect(statBoxes).toHaveCount(4);
  });

  test('repository count is populated from API', async ({ page }) => {
    const repoStat = page.locator('#stat-repos');
    // 4 total repos in mock data
    await expect(repoStat).toHaveText('4', { timeout: 5000 });
  });

  test('star count is populated from API', async ({ page }) => {
    const starStat = page.locator('#stat-stars');
    // 2 + 5 + 0 + 0 = 7 total stars
    await expect(starStat).toHaveText('7', { timeout: 5000 });
  });

  test('packages count shows static value', async ({ page }) => {
    const pkgStat = page.locator('#stat-packages');
    await expect(pkgStat).toHaveText('5');
  });

  test('ALGO balance is populated from API', async ({ page }) => {
    const balanceStat = page.locator('#stat-balance');
    // 12345678 micro-ALGO = 12.3457 ALGO
    await expect(balanceStat).toHaveText('12.3457', { timeout: 5000 });
  });

  test('stat labels are correct', async ({ page }) => {
    const labels = page.locator('.stat-label');
    const texts = await labels.allTextContents();
    expect(texts).toContain('Repositories');
    expect(texts).toContain('Stars');
    expect(texts).toContain('Packages');
    expect(texts).toContain('ALGO Balance');
  });
});

test.describe('Repository grid', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('repositories card header shows count', async ({ page }) => {
    const badge = page.locator('#repo-count');
    // 3 owned (non-fork) repos
    await expect(badge).toHaveText('3 owned', { timeout: 5000 });
  });

  test('repo items are rendered for non-fork repos', async ({ page }) => {
    const repoItems = page.locator('#repos-list .repo-item');
    // Should show 3 owned repos (forked-repo excluded)
    await expect(repoItems).toHaveCount(3, { timeout: 5000 });
  });

  test('repo names are links to GitHub', async ({ page }) => {
    const repoLink = page.locator('#repos-list .repo-name').first();
    await expect(repoLink).toBeVisible({ timeout: 5000 });
    const href = await repoLink.getAttribute('href');
    expect(href).toContain('github.com/corvid-agent/');
  });

  test('repo descriptions are displayed', async ({ page }) => {
    const desc = page.locator('#repos-list .repo-desc').first();
    await expect(desc).toBeVisible({ timeout: 5000 });
    const text = await desc.textContent();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('repo language badges are shown', async ({ page }) => {
    const langs = page.locator('#repos-list .repo-lang');
    await expect(langs.first()).toBeVisible({ timeout: 5000 });
    const texts = await langs.allTextContents();
    expect(texts).toContain('HTML');
    expect(texts).toContain('TypeScript');
  });

  test('repo star counts are shown for starred repos', async ({ page }) => {
    const stars = page.locator('#repos-list .repo-star');
    await expect(stars.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Activity feed', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('activity feed card is visible', async ({ page }) => {
    const header = page.locator('.card-title', { hasText: 'Recent Activity' });
    await expect(header).toBeVisible();
  });

  test('activity items are rendered from mock events', async ({ page }) => {
    const items = page.locator('#activity-feed .activity-item');
    // 3 events, capped at 12 but we only have 3
    await expect(items).toHaveCount(3, { timeout: 5000 });
  });

  test('push event shows repo name in code tag', async ({ page }) => {
    const firstActivity = page.locator('#activity-feed .activity-item').first();
    await expect(firstActivity).toBeVisible({ timeout: 5000 });
    const code = firstActivity.locator('code');
    await expect(code).toContainText('agent-profile');
  });

  test('activity items have timestamps', async ({ page }) => {
    const time = page.locator('#activity-feed .activity-time').first();
    await expect(time).toBeVisible({ timeout: 5000 });
    const text = await time.textContent();
    // Should show relative time like "just now", "1m ago", "1h ago"
    expect(text).toMatch(/ago|just now/);
  });
});

test.describe('Contribution graph', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('contribution graph card is visible', async ({ page }) => {
    const header = page.locator('.card-title', { hasText: 'Activity Graph' });
    await expect(header).toBeVisible();
  });

  test('contribution grid has 52 weeks', async ({ page }) => {
    const weeks = page.locator('#contrib-graph .contrib-week');
    await expect(weeks).toHaveCount(52, { timeout: 5000 });
  });

  test('each week has 7 day cells', async ({ page }) => {
    const firstWeek = page.locator('#contrib-graph .contrib-week').first();
    await expect(firstWeek).toBeVisible({ timeout: 5000 });
    const cells = firstWeek.locator('.contrib-cell');
    await expect(cells).toHaveCount(7);
  });

  test('contribution cells have title attributes with commit info', async ({ page }) => {
    const cell = page.locator('#contrib-graph .contrib-cell').first();
    await expect(cell).toBeAttached({ timeout: 5000 });
    const title = await cell.getAttribute('title');
    expect(title).toMatch(/commit/);
  });
});

test.describe('On-chain identity card', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('on-chain identity card is visible', async ({ page }) => {
    const header = page.locator('.card-title', { hasText: 'On-Chain Identity' });
    await expect(header).toBeVisible();
  });

  test('mainnet badge is shown', async ({ page }) => {
    const badge = page.locator('.card-badge', { hasText: 'mainnet' });
    await expect(badge).toBeVisible();
  });

  test('identity rows display expected fields', async ({ page }) => {
    const keys = page.locator('.id-key');
    const texts = await keys.allTextContents();
    expect(texts).toContain('Network');
    expect(texts).toContain('Wallet');
    expect(texts).toContain('Protocol');
    expect(texts).toContain('Encryption');
    expect(texts).toContain('A2A');
    expect(texts).toContain('Status');
  });

  test('network value shows Algorand Mainnet', async ({ page }) => {
    const row = page.locator('.identity-row').filter({ hasText: 'Network' });
    const val = row.locator('.id-val');
    await expect(val).toHaveText('Algorand Mainnet');
  });

  test('wallet address is populated as link after API loads', async ({ page }) => {
    const walletVal = page.locator('#wallet-addr');
    // After API loads, should contain truncated address as a link
    await expect(walletVal.locator('a')).toBeVisible({ timeout: 5000 });
    const linkText = await walletVal.locator('a').textContent();
    expect(linkText).toContain('WGSHC4TY');
    expect(linkText).toContain('MW25A');
  });

  test('copy button is present', async ({ page }) => {
    const copyBtn = page.locator('.copy-btn');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toHaveText('copy');
  });

  test('protocol shows AlgoChat v1', async ({ page }) => {
    const row = page.locator('.identity-row').filter({ hasText: 'Protocol' });
    const val = row.locator('.id-val');
    await expect(val).toHaveText('AlgoChat v1');
  });

  test('encryption shows AES-GCM + PSK', async ({ page }) => {
    const row = page.locator('.identity-row').filter({ hasText: 'Encryption' });
    const val = row.locator('.id-val');
    await expect(val).toHaveText('AES-GCM + PSK');
  });
});

test.describe('Algorand holdings card', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('holdings card is visible with live badge', async ({ page }) => {
    const card = page.locator('.card').filter({ hasText: 'Algorand Holdings' });
    await expect(card).toBeVisible();
    const badge = card.locator('.card-badge', { hasText: 'live' });
    await expect(badge).toBeVisible();
  });

  test('ALGO balance is displayed', async ({ page }) => {
    const balance = page.locator('#algo-balance');
    // 12345678 / 1000000 = 12.3457 ALGO
    await expect(balance).toContainText('12.3457', { timeout: 5000 });
    await expect(balance).toContainText('ALGO');
  });

  test('min balance is shown', async ({ page }) => {
    const minBal = page.locator('#algo-min-balance');
    // 100000 / 1000000 = 0.1000
    await expect(minBal).toHaveText('0.1000', { timeout: 5000 });
  });

  test('assets held count is shown', async ({ page }) => {
    const assets = page.locator('#algo-assets');
    await expect(assets).toHaveText('2', { timeout: 5000 });
  });

  test('apps opted in count is shown', async ({ page }) => {
    const apps = page.locator('#algo-apps');
    await expect(apps).toHaveText('1', { timeout: 5000 });
  });

  test('apps created count is shown', async ({ page }) => {
    const created = page.locator('#algo-created');
    await expect(created).toHaveText('2', { timeout: 5000 });
  });

  test('detail grid labels are correct', async ({ page }) => {
    const labels = page.locator('.algo-detail-key');
    const texts = await labels.allTextContents();
    expect(texts).toContain('Min Balance');
    expect(texts).toContain('Assets Held');
    expect(texts).toContain('Apps Opted In');
    expect(texts).toContain('Apps Created');
  });
});

test.describe('Algorand transactions card', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('transactions card is visible', async ({ page }) => {
    const header = page.locator('.card-title', { hasText: 'Recent Transactions' });
    await expect(header).toBeVisible();
  });

  test('transaction items are rendered', async ({ page }) => {
    const items = page.locator('#txn-list .txn-item');
    // 3 transactions in mock data
    await expect(items).toHaveCount(3, { timeout: 5000 });
  });

  test('sent transaction shows negative amount', async ({ page }) => {
    const sentItem = page.locator('#txn-list .txn-item').first();
    await expect(sentItem).toBeVisible({ timeout: 5000 });
    const type = sentItem.locator('.txn-type');
    await expect(type).toHaveText('Sent');
    const amount = sentItem.locator('.txn-amount');
    await expect(amount).toHaveClass(/negative/);
    await expect(amount).toContainText('-0.5000 ALGO');
  });

  test('received transaction shows positive amount', async ({ page }) => {
    const recvItem = page.locator('#txn-list .txn-item').nth(1);
    await expect(recvItem).toBeVisible({ timeout: 5000 });
    const type = recvItem.locator('.txn-type');
    await expect(type).toHaveText('Received');
    const amount = recvItem.locator('.txn-amount');
    await expect(amount).toHaveClass(/positive/);
    await expect(amount).toContainText('+1.0000 ALGO');
  });

  test('app call transaction shows app label', async ({ page }) => {
    const appItem = page.locator('#txn-list .txn-item').nth(2);
    await expect(appItem).toBeVisible({ timeout: 5000 });
    const type = appItem.locator('.txn-type');
    await expect(type).toHaveText('App Call');
    const amount = appItem.locator('.txn-amount');
    await expect(amount).toHaveText('app');
  });

  test('transaction view links point to explorer', async ({ page }) => {
    const link = page.locator('#txn-list .txn-link').first();
    await expect(link).toBeVisible({ timeout: 5000 });
    const href = await link.getAttribute('href');
    expect(href).toContain('algo-explorer');
    expect(href).toContain('tx=');
  });

  test('transactions show relative timestamps', async ({ page }) => {
    const time = page.locator('#txn-list .txn-time').first();
    await expect(time).toBeVisible({ timeout: 5000 });
    const text = await time.textContent();
    expect(text).toMatch(/ago|just now/);
  });

  test('transactions show truncated peer addresses', async ({ page }) => {
    const addr = page.locator('#txn-list .txn-addr').first();
    await expect(addr).toBeVisible({ timeout: 5000 });
    const text = await addr.textContent();
    // Should be truncated like "ABCDEF...EF12"
    expect(text).toContain('...');
  });
});

test.describe('Technologies section', () => {
  test.beforeEach(async ({ page }) => {
    await mockAPIs(page);
    await page.goto('/');
  });

  test('technologies card is visible', async ({ page }) => {
    const header = page.locator('.card-title', { hasText: 'Technologies & Skills' });
    await expect(header).toBeVisible();
  });

  test('tech grid contains expected technologies', async ({ page }) => {
    const tags = page.locator('.tech-grid .tech-tag');
    const count = await tags.count();
    expect(count).toBe(18);

    const texts = await tags.allTextContents();
    const cleaned = texts.map(t => t.replace(/^\S+\s/, '').trim());
    expect(cleaned).toContain('TypeScript');
    expect(cleaned).toContain('Node.js');
    expect(cleaned).toContain('Algorand');
    expect(cleaned).toContain('Claude AI');
    expect(cleaned).toContain('MCP');
    expect(cleaned).toContain('A2A Protocol');
    expect(cleaned).toContain('Vitest');
    expect(cleaned).toContain('GitHub Actions');
    expect(cleaned).toContain('Swift');
    expect(cleaned).toContain('SwiftUI');
    expect(cleaned).toContain('macOS');
  });

  test('agent badge is shown on technologies card', async ({ page }) => {
    const badge = page.locator('.card-badge', { hasText: 'agent' });
    await expect(badge).toBeVisible();
  });
});

test.describe('API error handling', () => {
  test('page handles GitHub API failure gracefully', async ({ page }) => {
    await page.route('**/api.github.com/**', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );
    await page.route('**/mainnet-api.4160.nodely.dev/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ALGO_ACCOUNT),
      })
    );
    await page.route('**/mainnet-idx.4160.nodely.dev/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TRANSACTIONS),
      })
    );

    await page.goto('/');

    // Should show fallback values
    const repoStat = page.locator('#stat-repos');
    await expect(repoStat).toContainText('49+', { timeout: 5000 });

    // Static content should still be present
    await expect(page.locator('h1.profile-name')).toContainText('corvid-agent');
    await expect(page.locator('.profile-tagline')).toBeVisible();
  });

  test('page handles Algorand API failure gracefully', async ({ page }) => {
    await page.route('**/api.github.com/users/corvid-agent/repos*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_REPOS),
      })
    );
    await page.route('**/api.github.com/users/corvid-agent/events/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EVENTS),
      })
    );
    await page.route('**/mainnet-api.4160.nodely.dev/**', route =>
      route.fulfill({ status: 500, body: 'Server Error' })
    );
    await page.route('**/mainnet-idx.4160.nodely.dev/**', route =>
      route.fulfill({ status: 500, body: 'Server Error' })
    );

    await page.goto('/');

    // Balance should show fallback
    const balance = page.locator('#algo-balance');
    await expect(balance).toContainText('--', { timeout: 5000 });

    // GitHub data should still load fine
    const repoStat = page.locator('#stat-repos');
    await expect(repoStat).toHaveText('4', { timeout: 5000 });
  });
});
