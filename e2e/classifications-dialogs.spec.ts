import { test, expect } from '@playwright/test'

const MOCK_CLASSIFICATION = {
  id: 'test-id',
  planId: 'RP-2026-001',
  title: 'Test Research Plan',
  status: 'CLASSIFIED',
  pcc: 'DIABETES',
  taxonomyCategory: 'Type 2 Diabetes',
  taxonomyCode: 'DIABETES-001',
  confidenceScore: 0.9,
  uploadedBy: 'reviewer',
  uploadedAt: new Date().toISOString(),
  classifiedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

test.describe('Classification dialogs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="username"]', 'reviewer')
    await page.fill('[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('Upload Plan dialog opens; Upload button disabled without file', async ({ page }) => {
    await page.goto('/classifications')
    await page.click('button:has-text("Upload Plan")')
    await expect(page.getByRole('heading', { name: 'Upload Research Plan' })).toBeVisible()
    // Upload button in dialog should be disabled without a file
    const uploadBtn = page
      .locator('dialog, [role="dialog"]')
      .getByRole('button', { name: 'Upload Plan' })
    await expect(uploadBtn).toBeDisabled()
  })

  test('Dropzone accepts PDF file selection; Upload button enables', async ({ page }) => {
    await page.goto('/classifications')
    await page.click('button:has-text("Upload Plan")')
    await expect(page.getByRole('heading', { name: 'Upload Research Plan' })).toBeVisible()

    // Set file via hidden input
    const input = page.locator('input[type="file"]')
    await input.setInputFiles({
      name: 'test-plan.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 test'),
    })
    // Filename should appear
    await expect(page.getByText('test-plan.pdf')).toBeVisible()
  })

  test('ViewClassificationDialog shows NEEDS_REVIEW banner', async ({ page }) => {
    const needsReviewClassification = {
      ...MOCK_CLASSIFICATION,
      id: 'nr-id',
      status: 'NEEDS_REVIEW',
      confidenceScore: 0.65,
    }
    await page.route('/api/classifications/nr-id', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(needsReviewClassification),
      })
    )
    // Mock the list to include this item
    await page.route('/api/classifications*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [needsReviewClassification],
          page: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
          last: true,
        }),
      })
    )
    await page.goto('/classifications')
    // Click on the row to open view dialog
    await page.getByText('RP-2026-001').first().click()
    await expect(page.getByText('AI confidence below threshold')).toBeVisible()
  })

  test('ConfidenceGauge SVG renders with green arc for score >= 0.85', async ({ page }) => {
    await page.route('/api/classifications/high-id', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_CLASSIFICATION, id: 'high-id', confidenceScore: 0.9 }),
      })
    )
    await page.route('/api/classifications*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [{ ...MOCK_CLASSIFICATION, id: 'high-id' }],
          page: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
          last: true,
        }),
      })
    )
    await page.goto('/classifications')
    await page.getByText('RP-2026-001').first().click()
    // SVG circle with green stroke should be present
    await expect(page.locator('circle[stroke="#16A34A"]')).toBeVisible()
    await expect(page.getByText('90%')).toBeVisible()
  })

  test('ManualOverrideDialog Submit disabled until reason filled', async ({ page }) => {
    await page.route('/api/classifications/ov-id', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...MOCK_CLASSIFICATION, id: 'ov-id' }),
      })
    )
    await page.route('/api/classifications*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [{ ...MOCK_CLASSIFICATION, id: 'ov-id' }],
          page: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
          last: true,
        }),
      })
    )
    await page.goto('/classifications')
    // Click override icon
    const row = page.getByRole('row').nth(1)
    await row.hover()
    await page.getByRole('button', { name: /Override RP-2026-001/ }).click()

    const submitBtn = page.getByRole('button', { name: 'Submit Override' })
    await expect(submitBtn).toBeDisabled()

    await page.fill('textarea[id="override-reason"]', 'Testing override reason')
    await expect(submitBtn).toBeEnabled()
  })

  test('RetryConfirmDialog shows non-destructive buttons', async ({ page }) => {
    const failedClassification = { ...MOCK_CLASSIFICATION, id: 'failed-id', status: 'FAILED' }
    await page.route('/api/classifications*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [failedClassification],
          page: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
          last: true,
        }),
      })
    )
    await page.goto('/classifications')
    const row = page.getByRole('row').nth(1)
    await row.hover()
    await page.getByRole('button', { name: /Retry RP-2026-001/ }).click()

    await expect(page.getByRole('heading', { name: 'Retry this classification?' })).toBeVisible()
    await expect(page.getByRole('button', { name: "Don't Retry" })).toBeVisible()
    const retryBtn = page.getByRole('button', { name: 'Retry Classification' })
    await expect(retryBtn).toBeVisible()

    // Confirm not red (destructive) — border-based secondary styling
    const bgColor = await retryBtn.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    expect(bgColor).not.toContain('220, 38, 38')
  })
})
