import { test, expect } from '@playwright/test'

test.describe('Classifications list page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as reviewer
    await page.goto('/login')
    await page.fill('[name="username"]', 'reviewer')
    await page.fill('[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/classifications')
  })

  test('shows page title and Upload Plan CTA', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Classifications' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload Plan' })).toBeVisible()
  })

  test('shows empty state when no data', async ({ page }) => {
    // Mock empty response
    await page.route('/api/classifications*', route => route.fulfill({
      status: 200,
      body: JSON.stringify({ content: [], page: 0, size: 25, totalElements: 0, totalPages: 0 })
    }))
    await page.reload()
    await expect(page.getByText('No research plans yet')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload Plan' })).toBeVisible()
  })

  test('shows filter-empty state when filters return no results', async ({ page }) => {
    await page.route('/api/classifications*', route => route.fulfill({
      status: 200,
      body: JSON.stringify({ content: [], page: 0, size: 25, totalElements: 0, totalPages: 0 })
    }))
    await page.goto('/classifications?status=FAILED')
    await expect(page.getByText('No plans match your filters')).toBeVisible()
    await expect(page.getByText('Clear all filters')).toBeVisible()
  })

  test('shows PROCESSING status badge with animate-ping ring', async ({ page }) => {
    await page.route('/api/classifications*', route => route.fulfill({
      status: 200,
      body: JSON.stringify({
        content: [{ id: '1', planId: 'RP-2026-001', title: 'Test', status: 'PROCESSING',
                    uploadedBy: 'reviewer', uploadedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        page: 0, size: 25, totalElements: 1, totalPages: 1
      })
    }))
    await page.reload()
    await expect(page.getByText('Processing')).toBeVisible()
    // animate-ping element should be present for PROCESSING status
    const pingEl = page.locator('.animate-ping').first()
    await expect(pingEl).toBeVisible()
  })

  test('filter state persists in URL params', async ({ page }) => {
    const statusSelect = page.locator('select[aria-label="Filter by status"]')
    await statusSelect.selectOption('CLASSIFIED')
    await expect(page).toHaveURL(/status=CLASSIFIED/)
  })

  test('active filter chip appears and can be removed', async ({ page }) => {
    await page.goto('/classifications?status=PENDING')
    const chip = page.locator('span:has-text("PENDING")')
    await expect(chip).toBeVisible()
    // Remove chip
    await chip.locator('button').click()
    await expect(page).not.toHaveURL(/status=/)
  })

  test('shows skeleton rows during loading', async ({ page }) => {
    let resolve: () => void
    await page.route('/api/classifications*', route => {
      new Promise<void>(r => { resolve = r }).then(() => route.fulfill({
        status: 200,
        body: JSON.stringify({ content: [], page: 0, size: 25, totalElements: 0, totalPages: 0 })
      }))
    })
    await page.reload()
    await expect(page.locator('.animate-pulse').first()).toBeVisible()
    resolve!()
  })

  test('row hover reveals View and Override action icons', async ({ page }) => {
    await page.route('/api/classifications*', route => route.fulfill({
      status: 200,
      body: JSON.stringify({
        content: [{ id: '1', planId: 'RP-2026-001', title: 'Test', status: 'CLASSIFIED',
                    uploadedBy: 'reviewer', uploadedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
        page: 0, size: 25, totalElements: 1, totalPages: 1
      })
    }))
    await page.reload()
    const row = page.getByRole('row').nth(1)
    await row.hover()
    await expect(page.getByRole('button', { name: /View RP-2026-001/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Override RP-2026-001/ })).toBeVisible()
  })
})
