import { test, expect } from '@playwright/test'

test.describe('Taxonomy management page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="username"]', 'admin')
    await page.fill('[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/taxonomy')
  })

  test('shows two-pane layout: left tree + right empty state', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Taxonomy Management' })).toBeVisible()
    await expect(page.getByText('Select a category')).toBeVisible()
    // Left pane has tree
    await expect(page.getByRole('tree')).toBeVisible()
  })

  test('PCC seed nodes visible in tree', async ({ page }) => {
    await page.route('/api/taxonomy/tree', route => route.fulfill({
      status: 200,
      body: JSON.stringify([
        { category: { id: '1', code: 'DIABETES', name: 'Type 2 Diabetes', isActive: true, level: 0, displayOrder: 1, createdAt: '', updatedAt: '' }, children: [] },
      ])
    }))
    await page.reload()
    await expect(page.getByText('DIABETES')).toBeVisible()
  })

  test('clicking a tree node shows detail in right pane', async ({ page }) => {
    await page.route('/api/taxonomy/tree', route => route.fulfill({
      status: 200,
      body: JSON.stringify([
        { category: { id: '1', code: 'DIABETES', name: 'Type 2 Diabetes', isActive: true, level: 0, displayOrder: 1, createdAt: '', updatedAt: '' }, children: [] },
      ])
    }))
    await page.reload()
    await page.click('[role="treeitem"]')
    await expect(page.getByText('Type 2 Diabetes')).toBeVisible()
    await expect(page.getByText('DIABETES')).toBeVisible()
    // Edit button appears
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
  })

  test('inactive node shows opacity and (Inactive) suffix', async ({ page }) => {
    await page.route('/api/taxonomy/tree', route => route.fulfill({
      status: 200,
      body: JSON.stringify([
        { category: { id: '2', code: 'CANCER', name: 'Cancer', isActive: false, level: 0, displayOrder: 3, createdAt: '', updatedAt: '' }, children: [] },
      ])
    }))
    await page.reload()
    await expect(page.getByText('(Inactive)')).toBeVisible()
    const node = page.getByRole('treeitem', { name: /CANCER/ })
    const opacity = await node.evaluate(el => window.getComputedStyle(el).opacity)
    expect(parseFloat(opacity)).toBeLessThan(1)
  })

  test('Add Category dialog opens; breadcrumb preview updates', async ({ page }) => {
    await page.click('button:has-text("Add Category")')
    await expect(page.getByText('Add Taxonomy Category')).toBeVisible()
    await page.fill('#add-code', 'TEST-001')
    await expect(page.getByText(/TEST-001/)).toBeVisible()  // breadcrumb
  })

  test('Deactivate confirm dialog shows red Deactivate button (not gradient)', async ({ page }) => {
    await page.route('/api/taxonomy/tree', route => route.fulfill({
      status: 200,
      body: JSON.stringify([
        { category: { id: '1', code: 'DIABETES', name: 'Type 2 Diabetes', isActive: true, level: 0, displayOrder: 1, createdAt: '', updatedAt: '' }, children: [] },
      ])
    }))
    await page.reload()
    await page.click('[role="treeitem"]')
    await page.click('button:has-text("Deactivate")')
    const deactivateBtn = page.getByRole('button', { name: 'Deactivate' }).last()
    await expect(deactivateBtn).toBeVisible()
    const bg = await deactivateBtn.evaluate(el => window.getComputedStyle(el).backgroundColor)
    // Should be red #DC2626 → rgb(220, 38, 38) — NOT gradient
    expect(bg).toContain('220, 38, 38')
  })

  test('TaxonomySearchBar debounces and shows results', async ({ page }) => {
    await page.route('/api/taxonomy/search*', route => route.fulfill({
      status: 200,
      body: JSON.stringify([{ id: '1', code: 'DIABETES', name: 'Type 2 Diabetes', isActive: true, level: 0, displayOrder: 1, createdAt: '', updatedAt: '' }])
    }))
    await page.fill('input[placeholder*="Search"]', 'diab')
    await page.waitForTimeout(350)  // wait for debounce
    await expect(page.getByText(/DIABETES.*Type 2 Diabetes/)).toBeVisible()
  })
})
