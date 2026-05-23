import { test, expect } from '@playwright/test'

test.describe('Classifications list page', () => {
  test.beforeEach(async ({ page }) => {
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
    await page.route('/api/classifications*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [],
          page: 0,
          size: 25,
          totalElements: 0,
          totalPages: 0,
          last: true,
        }),
      })
    )
    await page.reload()
    await expect(page.getByText('No research plans yet')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload Plan' }).last()).toBeVisible()
  })

  test('shows filter-empty state when filters return no results', async ({ page }) => {
    await page.route('/api/classifications*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [],
          page: 0,
          size: 25,
          totalElements: 0,
          totalPages: 0,
          last: true,
        }),
      })
    )
    await page.goto('/classifications?status=FAILED')
    await expect(page.getByText('No plans match your filters')).toBeVisible()
    await expect(page.getByText('Clear all filters')).toBeVisible()
  })

  test('shows PROCESSING status badge with animate-ping ring', async ({ page }) => {
    await page.route('/api/classifications*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              id: '00000000-0000-0000-0000-000000000001',
              planId: 'RP-2026-001',
              title: 'Test Plan',
              status: 'PROCESSING',
              uploadedBy: 'reviewer',
              uploadedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          page: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
          last: true,
        }),
      })
    )
    await page.reload()
    await expect(page.getByText('Processing')).toBeVisible()
    const pingEl = page.locator('.animate-ping').first()
    await expect(pingEl).toBeVisible()
  })

  test('filter state persists in URL params', async ({ page }) => {
    const statusSelect = page.locator('select[aria-label="Filter by status"]')
    await statusSelect.selectOption('CLASSIFIED')
    await expect(page).toHaveURL(/status=CLASSIFIED/)
  })

  test('active filter chip appears when status filter is set', async ({ page }) => {
    await page.goto('/classifications?status=PENDING')
    await expect(page.getByText('PENDING')).toBeVisible()
  })

  test('shows skeleton rows during loading', async ({ page }) => {
    let resolveRoute: (() => void) | undefined
    await page.route('/api/classifications*', (route) => {
      new Promise<void>((resolve) => {
        resolveRoute = resolve
      }).then(() =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: [],
            page: 0,
            size: 25,
            totalElements: 0,
            totalPages: 0,
            last: true,
          }),
        })
      )
    })
    await page.reload()
    await expect(page.locator('.animate-pulse').first()).toBeVisible()
    resolveRoute?.()
  })

  test('row hover reveals View and Override action icons', async ({ page }) => {
    await page.route('/api/classifications*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              id: '00000000-0000-0000-0000-000000000002',
              planId: 'RP-2026-002',
              title: 'Another Plan',
              status: 'CLASSIFIED',
              pcc: 'DIABETES',
              confidenceScore: 0.87,
              uploadedBy: 'reviewer',
              uploadedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          page: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
          last: true,
        }),
      })
    )
    await page.reload()
    const row = page.getByRole('row').nth(1)
    await row.hover()
    await expect(page.getByRole('button', { name: /View RP-2026-002/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Override RP-2026-002/ })).toBeVisible()
  })

  test('urgent alert bar shows for NEEDS_REVIEW classifications', async ({ page }) => {
    await page.route('/api/classifications*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              id: '00000000-0000-0000-0000-000000000003',
              planId: 'RP-2026-003',
              title: 'Review Plan',
              status: 'NEEDS_REVIEW',
              uploadedBy: 'reviewer',
              uploadedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          page: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
          last: true,
        }),
      })
    )
    await page.reload()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByText(/need review/)).toBeVisible()
  })
})
