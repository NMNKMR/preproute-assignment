import { test, expect } from '@playwright/test'

const USER_ID = process.env.E2E_USER_ID ?? 'vedant-admin'
const PASSWORD = process.env.E2E_PASSWORD ?? 'vedant123'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('User ID').fill(USER_ID)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 })
}

test('create a test, add a question, and publish it', async ({ page }) => {
  test.slow() // real backend round-trips
  await login(page)

  const testName = `E2E Test ${Date.now()}`

  // Dashboard -> Create
  await page.getByRole('button', { name: /create new test/i }).click()
  await expect(page).toHaveURL(/\/tests\/new$/)

  // Subject (a subject known to have topics/sub-topics)
  await page.getByTestId('subject-select').click()
  await page.getByText('General Aptitude Test', { exact: true }).click()
  await page.getByLabel('Name of Test').fill(testName)

  // Topic cascade
  await page.getByTestId('topic-select').click()
  await page.getByText('Dice', { exact: true }).click()
  await page.getByTestId('topic-select').click() // close dropdown

  // Sub topic cascade
  await page.getByTestId('subtopic-select').click()
  await page.getByText('Games', { exact: true }).click()
  await page.getByTestId('subtopic-select').click()

  await page.getByLabel('No of Questions').fill('1')
  await page.getByRole('button', { name: 'Next' }).click()

  // Add Questions
  await expect(page).toHaveURL(/\/tests\/[^/]+\/questions$/)
  const testId = page.url().match(/tests\/([^/]+)\/questions/)![1]
  await expect(page.getByText(/total questions/i)).toBeVisible()
  await page.locator('.ql-editor').fill('What is 2 + 2?')
  await page.getByLabel('Option 1', { exact: true }).fill('3')
  await page.getByLabel('Option 2', { exact: true }).fill('4')
  await page.getByLabel('Option 3', { exact: true }).fill('5')
  await page.getByLabel('Option 4', { exact: true }).fill('6')
  await page.getByLabel('Mark option 2 correct').check()
  await page.getByRole('button', { name: /save & publish/i }).first().click()

  // Preview & Publish
  await expect(page).toHaveURL(/\/preview$/)
  await expect(page.getByText('Test created')).toBeVisible()
  await expect(page.getByText('What is 2 + 2?')).toBeVisible()
  await page.getByRole('button', { name: 'Publish Test' }).click()

  // Back on dashboard with the new test listed (search to avoid pagination)
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.getByLabel('Search tests').fill(testName)
  await expect(page.getByText(testName)).toBeVisible()

  // Re-open the questions page: the saved question is fetched and hydrated.
  await page.goto(`/tests/${testId}/questions`)
  await expect(page.locator('.ql-editor')).toContainText('What is 2 + 2?')
  await expect(page.getByLabel('Option 2', { exact: true })).toHaveValue('4')
})
