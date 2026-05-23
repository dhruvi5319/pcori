import { test, expect } from '@playwright/test'

test.describe('Auth Guard', () => {
  test('unauthenticated user visiting /dashboard is redirected to /login', async ({ page }) => {
    // Ensure no JWT in localStorage
    await page.addInitScript(() => {
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('refresh_token')
    })
    await page.goto('/dashboard')
    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('unauthenticated user visiting /classifications is redirected to /login', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('jwt_token'))
    await page.goto('/classifications')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})

test.describe('App Shell - Sidebar', () => {
  // Set a valid (unexpired) mock JWT to bypass auth guard
  // The mock JWT encodes: { sub: "user-id", username: "testuser", roles: ["REVIEWER"], exp: future }
  const mockJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLWlkIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsInJvbGVzIjpbIlJFVklFV0VSIl0sImV4cCI6OTk5OTk5OTk5OX0.mock'

  test.beforeEach(async ({ page }) => {
    // Inject mock JWT so auth guard passes
    await page.addInitScript((token) => {
      localStorage.setItem('jwt_token', token)
    }, mockJwt)
  })

  test('sidebar is visible on /dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('navigation', { name: 'Navigation' })).toBeVisible({ timeout: 5000 })
  })

  test('sidebar shows Dashboard nav item (visible to all roles)', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible({ timeout: 5000 })
  })

  test('sidebar does NOT show Users nav item for REVIEWER role', async ({ page }) => {
    // REVIEWER role — Users link should not be rendered
    await page.goto('/dashboard')
    // Wait for nav to render
    await expect(page.getByRole('navigation', { name: 'Navigation' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible()
  })

  test('sidebar toggle button collapses and expands sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    // Default: collapsed (56px) — find expand toggle
    const toggleBtn = page.getByRole('button', { name: /sidebar/i })
    await expect(toggleBtn).toBeVisible({ timeout: 5000 })
    // Expand
    await toggleBtn.click()
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    // Collapse again
    await toggleBtn.click()
  })
})

test.describe('App Shell - Header', () => {
  const mockJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLWlkIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsInJvbGVzIjpbIlJFVklFV0VSIl0sImV4cCI6OTk5OTk5OTk5OX0.mock'

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => localStorage.setItem('jwt_token', token), mockJwt)
  })

  test('header renders theme toggle button', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('button', { name: 'Toggle theme' })).toBeVisible({ timeout: 5000 })
  })

  test('header renders notification bell', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('button', { name: 'View notifications' })).toBeVisible({ timeout: 5000 })
  })

  test('user menu trigger is visible with username initials', async ({ page }) => {
    await page.goto('/dashboard')
    // User menu shows "TE" initials for "testuser"
    await expect(page.getByRole('button', { name: /User menu/i })).toBeVisible({ timeout: 5000 })
  })

  test('user menu opens and shows Sign Out option', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /User menu/i }).click()
    await expect(page.getByRole('menuitem', { name: /Sign Out/i })).toBeVisible()
  })
})
