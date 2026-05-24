import { test, expect } from '@playwright/test'

const MOCK_TREE = [
  {
    category: {
      id: '1',
      code: 'DIABETES',
      name: 'Type 2 Diabetes',
      description: 'Research plans focused on Type 2 Diabetes',
      isActive: true,
      level: 0,
      displayOrder: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    children: [
      {
        category: {
          id: '1a',
          code: 'DIABETES-MGMT',
          name: 'Diabetes Management',
          isActive: true,
          level: 1,
          displayOrder: 1,
          parentId: '1',
          parentCode: 'DIABETES',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        children: [],
      },
    ],
  },
]

test.describe('Taxonomy management page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="username"]', 'admin')
    await page.fill('[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Mock taxonomy tree
    await page.route('/api/taxonomy/tree', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TREE),
      })
    )

    await page.goto('/taxonomy')
  })

  test('shows two-pane layout: left tree + right empty state', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Taxonomy Management' })).toBeVisible()
    await expect(page.getByText('Select a category')).toBeVisible()
    await expect(page.getByRole('tree')).toBeVisible()
  })

  test('PCC seed nodes visible in tree', async ({ page }) => {
    await expect(page.getByText('DIABETES')).toBeVisible()
    await expect(page.getByText('Type 2 Diabetes')).toBeVisible()
  })

  test('clicking a tree node shows detail in right pane', async ({ page }) => {
    await page.getByRole('treeitem').first().click()
    // Detail pane should show the node's code and name
    await expect(page.getByRole('heading', { name: 'Type 2 Diabetes', level: 2 })).toBeVisible()
    await expect(page.getByText('DIABETES').last()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
  })

  test('inactive node shows (Inactive) suffix', async ({ page }) => {
    await page.route('/api/taxonomy/tree', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            category: {
              id: '2',
              code: 'CANCER',
              name: 'Cancer',
              isActive: false,
              level: 0,
              displayOrder: 3,
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z',
            },
            children: [],
          },
        ]),
      })
    )
    await page.reload()
    await expect(page.getByText('(Inactive)')).toBeVisible()
  })

  test('Add Category dialog opens; breadcrumb preview updates', async ({ page }) => {
    await page.click('button:has-text("Add Category")')
    await expect(
      page.getByRole('heading', { name: 'Add Taxonomy Category' })
    ).toBeVisible()
    await page.fill('#add-code', 'TEST-001')
    // Breadcrumb should show the code
    await expect(page.getByText(/TEST-001/)).toBeVisible()
  })

  test('Deactivate confirm dialog shows red Deactivate button (not gradient)', async ({
    page,
  }) => {
    // Select a node first
    await page.getByRole('treeitem').first().click()
    // Click Deactivate button
    await page.getByRole('button', { name: 'Deactivate' }).first().click()
    // Find the confirm Deactivate button (not the dismiss one)
    const deactivateBtn = page.getByRole('button', { name: 'Deactivate' }).last()
    await expect(deactivateBtn).toBeVisible()
    // Confirm it has red background (#DC2626 = rgb(220, 38, 38))
    const bg = await deactivateBtn.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    )
    expect(bg).toContain('220, 38, 38')
  })

  test('TaxonomySearchBar debounces and shows results', async ({ page }) => {
    await page.route('/api/taxonomy/search*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            code: 'DIABETES',
            name: 'Type 2 Diabetes',
            isActive: true,
            level: 0,
            displayOrder: 1,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]),
      })
    )
    await page.fill('input[aria-label="Search taxonomy categories"]', 'diab')
    await page.waitForTimeout(400) // wait for 300ms debounce
    await expect(page.getByText(/DIABETES.*Type 2 Diabetes/)).toBeVisible()
  })
})
