import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('renders hero with correct headline and dual CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Automate Research Plan Classification' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Get Started/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign In' }).first()).toBeVisible()
  })

  test('features grid shows 3 feature cards', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('AI Classification')).toBeVisible()
    await expect(page.getByText('Full Audit Trail')).toBeVisible()
    await expect(page.getByText('Analytics & Reporting')).toBeVisible()
  })
})

test.describe('Login Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders with correct title and sign in button disabled initially', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign In to PCORI Analytics' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign In/ })).toBeDisabled()
  })

  test('enables submit button when both fields are filled', async ({ page }) => {
    await page.getByLabel('Username').fill('testuser')
    await page.getByLabel('Password').fill('password')
    await expect(page.getByRole('button', { name: /Sign In/ })).toBeEnabled()
  })

  test('password show/hide toggle changes input type', async ({ page }) => {
    const passwordInput = page.getByLabel('Password').first()
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Show password' }).click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    await page.getByRole('button', { name: 'Hide password' }).click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('forgot password link is present', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible()
  })

  test('sign up link navigates to /signup', async ({ page }) => {
    await page.getByRole('link', { name: /Sign up/i }).click()
    await expect(page).toHaveURL('/signup')
  })
})

test.describe('Signup Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup')
  })

  test('renders with correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  })

  test('submit button disabled initially', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeDisabled()
  })

  test('shows password strength indicator on focus', async ({ page }) => {
    await page.getByLabel('Password *').click()
    await expect(page.getByText('At least one uppercase letter')).toBeVisible()
  })

  test('shows username helper text', async ({ page }) => {
    await expect(page.getByText('3–50 characters, letters, numbers, and underscores only')).toBeVisible()
  })

  test('validates password complexity inline', async ({ page }) => {
    await page.getByLabel('Password *').fill('weakpass')
    await page.getByLabel('Password *').blur()
    await expect(page.getByText('Password must contain an uppercase letter')).toBeVisible()
  })
})

test.describe('Forgot Password Form', () => {
  test('renders with correct title and shows success message after submit', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible()
    await page.getByLabel('Email address').fill('any@example.com')
    await page.getByRole('button', { name: 'Send Reset Link' }).click()
    // Always shows success (email enumeration prevention)
    await expect(page.getByText(/If an account with that email exists/)).toBeVisible()
  })

  test('back to login link is visible', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('link', { name: /Back to login/i })).toBeVisible()
  })
})

test.describe('Email Verification Page', () => {
  test('shows loading state then error for invalid token', async ({ page }) => {
    await page.goto('/verify-email?token=invalid-not-a-uuid')
    // Either loading then error, or directly error
    await expect(page.getByText(/expired or was already used/i)).toBeVisible({ timeout: 10000 })
  })

  test('shows error state when no token provided', async ({ page }) => {
    await page.goto('/verify-email')
    await expect(page.getByText(/expired or was already used/i)).toBeVisible({ timeout: 10000 })
  })
})
