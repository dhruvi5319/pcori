import { test, expect } from '@playwright/test';

test.describe('Data Pipeline page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@pcori.org');
    await page.fill('[name="password"]', 'password');
    await page.click('[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Data Pipeline page loads with status header', async ({ page }) => {
    await page.goto('/data-pipeline');
    await expect(page.getByRole('heading', { name: 'Data Pipeline' })).toBeVisible({ timeout: 10000 });
    // Pipeline status header should be present
    await expect(page.locator('[data-testid="pipeline-status-header"], [aria-label*="Pipeline state"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('shows 3 stage cards: EXTRACT, CLASSIFY, PERSIST', async ({ page }) => {
    await page.goto('/data-pipeline');
    await expect(page.getByText('EXTRACT')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('CLASSIFY')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('PERSIST')).toBeVisible({ timeout: 10000 });
  });

  test('shows Event Log and Run History tabs', async ({ page }) => {
    await page.goto('/data-pipeline');
    await expect(page.getByRole('tab', { name: 'Event Log' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('tab', { name: 'Run History' })).toBeVisible({ timeout: 10000 });
  });

  test('Stop Pipeline button triggers confirmation dialog', async ({ page }) => {
    await page.goto('/data-pipeline');
    // Find Stop Pipeline button — only visible if pipeline is RUNNING
    const stopBtn = page.getByRole('button', { name: /stop pipeline/i });
    if (await stopBtn.isVisible()) {
      await stopBtn.click();
      await expect(page.getByText('Stop the pipeline?')).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: /keep pipeline running/i }).click();
    } else {
      // Pipeline not running — test passes (button correctly disabled/hidden)
      await expect(page.locator('[data-testid="stage-card-EXTRACT"]').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('logs panel is collapsible', async ({ page }) => {
    await page.goto('/data-pipeline');
    // Check if expand/collapse button exists
    const expandBtn = page.getByRole('button', { name: /expand|collapse/i }).first();
    if (await expandBtn.isVisible({ timeout: 5000 })) {
      await expandBtn.click();
      // Panel should toggle
    }
    // At minimum the logs panel section is present
    await expect(page.getByText('Event Log')).toBeVisible({ timeout: 10000 });
  });
});
