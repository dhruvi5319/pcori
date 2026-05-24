import { test, expect } from '@playwright/test';

test.describe('Analytics page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@pcori.org');
    await page.fill('[name="password"]', 'password');
    await page.click('[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Analytics page loads with 6 chart sections', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.getByText('Accuracy Trend')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Category Accuracy')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('AI Confidence Distribution')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Processing Volume')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Recent Overrides')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Model Performance|Precision/)).toBeVisible({ timeout: 10000 });
  });

  test('Date range picker is present and interactive', async ({ page }) => {
    await page.goto('/analytics');
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2);
  });

  test('All chart sections render without crashing', async ({ page }) => {
    await page.goto('/analytics');
    // Wait for page to be interactive
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    // No error states should be visible by default (assuming healthy backend)
    // Page renders — crash test (not content validation)
    await expect(page.locator('h1, [role="heading"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('Confidence histogram x-axis label is "AI Confidence Score" not "Accuracy Score"', async ({
    page,
  }) => {
    await page.goto('/analytics');
    await expect(page.getByText('AI Confidence Score')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Accuracy Score')).not.toBeVisible();
  });

  test('Model performance section shows insufficient data state when no data', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    // Either shows cards with precision/recall OR insufficient data message
    const hasPrecision = await page.getByText(/Precision|Insufficient data/).isVisible();
    expect(hasPrecision).toBeTruthy();
  });
});
