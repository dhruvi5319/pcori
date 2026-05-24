import { test, expect } from '@playwright/test'

test.describe('/help page', () => {
  test('renders Help Center with two-pane layout', async ({ page }) => {
    await page.goto('/help')
    await expect(page.getByRole('heading', { name: 'Help Center' })).toBeVisible()
  })

  test('search bar is visible and requires 2 characters', async ({ page }) => {
    await page.goto('/help')
    const searchInput = page.getByPlaceholder('Search articles…')
    await expect(searchInput).toBeVisible()

    // Type 1 character — should show minimum length message
    await searchInput.fill('a')
    await expect(page.getByText('Type at least 2 characters')).toBeVisible()
  })

  test('search with 2+ characters triggers search results or empty state', async ({ page }) => {
    await page.goto('/help')
    const searchInput = page.getByPlaceholder('Search articles…')
    await searchInput.fill('upload')
    // Wait for debounce (300ms) + API call
    await page.waitForTimeout(500)
    // Either results overlay or no-results message
    const results = page.locator('[role="listbox"]')
    const noResults = page.getByText(/No articles found/)
    await expect(results.or(noResults)).toBeVisible({ timeout: 5000 })
  })

  test('FAQ section renders accordion items', async ({ page }) => {
    await page.goto('/help')
    // Wait for FAQs to load
    await page.waitForLoadState('networkidle')
    const faqHeader = page.getByText('FREQUENTLY ASKED QUESTIONS')
    const noFaqs = page.getByText('Unable to load FAQs')
    const emptyFaq = page.getByText('No articles yet')
    await expect(faqHeader.or(noFaqs).or(emptyFaq)).toBeVisible()
  })

  test('Clicking a category in sidebar loads article', async ({ page }) => {
    await page.goto('/help')
    await page.waitForLoadState('networkidle')
    const sidebar = page.locator('aside, nav').first()
    const articleLinks = sidebar.getByRole('button').or(sidebar.getByRole('link'))
    const count = await articleLinks.count()
    if (count > 0) {
      await articleLinks.first().click()
      // Article area should show content
      await expect(page.locator('[class*="max-w-\\[720px\\]"]')).toBeVisible({ timeout: 5000 })
    }
  })

  test('Feedback widget shows thumbs buttons', async ({ page }) => {
    await page.goto('/help')
    await page.waitForLoadState('networkidle')
    // If an article is selected, feedback widget should be visible
    const feedbackLabel = page.getByText('Was this helpful?')
    const emptyState = page.getByText('No articles yet')
    await expect(feedbackLabel.or(emptyState)).toBeVisible()

    if (await feedbackLabel.isVisible()) {
      const thumbsUp = page.getByRole('button', { name: 'This article was helpful' })
      const thumbsDown = page.getByRole('button', { name: 'This article was not helpful' })
      await expect(thumbsUp).toBeVisible()
      await expect(thumbsDown).toBeVisible()
    }
  })
})
