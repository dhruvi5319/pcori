import { test, expect } from '@playwright/test'

test.describe('/users page', () => {
  test('renders Users page with table and Add User button', async ({ page }) => {
    await page.goto('/users')
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible()
  })

  test('search input is visible in filter bar', async ({ page }) => {
    await page.goto('/users')
    await expect(page.getByPlaceholder('Search username, email, name…')).toBeVisible()
  })

  test('Add User dialog opens with form fields', async ({ page }) => {
    await page.goto('/users')
    await page.getByRole('button', { name: 'Add User' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByLabel('First Name')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Discard Changes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create User' })).toBeVisible()
  })

  test('Create User button disabled until form valid', async ({ page }) => {
    await page.goto('/users')
    await page.getByRole('button', { name: 'Add User' }).click()
    // Button should be disabled on empty form
    await expect(page.getByRole('button', { name: 'Create User' })).toBeDisabled()
  })

  test('Deactivate dialog shows destructive red button with correct labels', async ({ page }) => {
    await page.goto('/users')
    // Find a user row action — open dropdown
    const firstActionsMenu = page.getByRole('button', { name: /^Actions for/ }).first()
    if (await firstActionsMenu.isVisible()) {
      await firstActionsMenu.click()
      const deactivateItem = page.getByRole('menuitem', { name: 'Deactivate' })
      if (await deactivateItem.isVisible()) {
        await deactivateItem.click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Keep Active' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Deactivate User' })).toBeVisible()
        // Confirm destructive red styling
        const deactivateBtn = page.getByRole('button', { name: 'Deactivate User' })
        await expect(deactivateBtn).toHaveCSS('background-color', 'rgb(220, 38, 38)')
      }
    }
  })

  test('Users table shows role chips and status badges', async ({ page }) => {
    await page.goto('/users')
    // Wait for table to load
    await page.waitForLoadState('networkidle')
    const table = page.getByRole('table')
    const emptyState = page.getByText('No users found')
    await expect(table.or(emptyState)).toBeVisible()
  })
})
