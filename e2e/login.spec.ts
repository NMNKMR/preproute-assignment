import { test, expect } from '@playwright/test'

const USER_ID = process.env.E2E_USER_ID ?? 'vedant-admin'
const PASSWORD = process.env.E2E_PASSWORD ?? 'vedant123'

test.describe('Login', () => {
  test('rejects empty submit with validation errors', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.getByText('User ID is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('logs in with valid credentials and lands on the dashboard', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByLabel('User ID').fill(USER_ID)
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 })
    // Token persisted for subsequent authenticated requests.
    const token = await page.evaluate(() =>
      localStorage.getItem('preproute_token'),
    )
    expect(token).toBeTruthy()
  })

  test('redirects unauthenticated users away from protected routes', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })
})
