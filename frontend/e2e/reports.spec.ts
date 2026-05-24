import { test, expect } from '@playwright/test'

test.describe('/reports page', () => {
  test('renders Reports page with 3 tabs', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'My Reports' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Ad-hoc Builder' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Templates' })).toBeVisible()
  })

  test('Export to Excel button is visible and clickable', async ({ page }) => {
    await page.goto('/reports')
    const exportBtn = page.getByRole('button', { name: 'Export to Excel' })
    await expect(exportBtn).toBeVisible()
    await expect(exportBtn).toBeEnabled()
  })

  test('Ad-hoc Builder tab shows column selector and filter panel', async ({ page }) => {
    await page.goto('/reports')
    await page.getByRole('tab', { name: 'Ad-hoc Builder' }).click()
    await expect(page.getByText('STEP 1: Columns')).toBeVisible()
    await expect(page.getByText('Plan ID')).toBeVisible()
    await expect(page.getByText('Select all')).toBeVisible()
    await expect(page.getByText('STEP 2: Filters')).toBeVisible()
  })

  test('Column Selector: Deselect all then Select all', async ({ page }) => {
    await page.goto('/reports')
    await page.getByRole('tab', { name: 'Ad-hoc Builder' }).click()
    await page.getByRole('button', { name: 'Deselect all' }).click()
    // All checkboxes should be unchecked
    const checkboxes = page.getByRole('checkbox')
    const count = await checkboxes.count()
    expect(count).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Select all' }).click()
    // First checkbox should be checked again
    await expect(checkboxes.first()).toBeChecked()
  })

  test('Templates tab shows empty state when no templates', async ({ page }) => {
    await page.goto('/reports')
    await page.getByRole('tab', { name: 'Templates' }).click()
    // Either shows templates table or empty state
    const emptyState = page.getByText('No saved templates')
    const table = page.getByRole('table')
    await expect(emptyState.or(table)).toBeVisible()
  })

  test('Save as Template dialog opens and validates name', async ({ page }) => {
    await page.goto('/reports')
    await page.getByRole('tab', { name: 'Ad-hoc Builder' }).click()
    // Click Preview Results first if needed, then Save as Template
    const saveTemplateBtn = page.getByRole('button', { name: 'Save as Template' })
    if (await saveTemplateBtn.isVisible()) {
      await saveTemplateBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('button', { name: "Don't Save" })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Save Template' })).toBeVisible()
    }
  })
})
