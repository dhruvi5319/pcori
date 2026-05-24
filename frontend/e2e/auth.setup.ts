import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  // Navigate to login
  await page.goto('/login')

  // Fill credentials — use test admin account
  await page.getByLabel('Username').fill(process.env.TEST_USERNAME ?? 'admin')
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD ?? 'password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Wait for redirect to protected area
  await page.waitForURL('**/dashboard', { timeout: 10_000 })

  // Save auth state
  await page.context().storageState({ path: authFile })
})
