import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Dashboard } from '@/pages/Dashboard'
import { renderWithProviders } from '@tests/utils/renderWithProviders'
import { server } from '@tests/mocks/server'
import { tests as fixtureTests } from '@tests/mocks/fixtures'
import { API_BASE_URL } from '@/lib/env'
import type { Test } from '@/api/types'

/** Override GET /tests to return `count` generated draft tests. */
function withManyTests(count: number) {
  const data: Test[] = Array.from({ length: count }, (_, i) => ({
    ...fixtureTests[0],
    id: `paged-${i + 1}`,
    name: `Paged Test ${i + 1}`,
  }))
  server.use(
    http.get(`${API_BASE_URL}/tests`, () =>
      HttpResponse.json({ status: 'success', message: 'ok', data }),
    ),
  )
}

describe('Dashboard', () => {
  it('lists tests from the API', async () => {
    renderWithProviders(<Dashboard />)
    expect(await screen.findByText('Algebra Basics')).toBeInTheDocument()
    expect(screen.getByText('Aptitude Mock')).toBeInTheDocument()
  })

  it('filters by search term', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard />)
    await screen.findByText('Algebra Basics')

    await user.type(screen.getByLabelText(/search tests/i), 'aptitude')

    expect(screen.queryByText('Algebra Basics')).not.toBeInTheDocument()
    expect(screen.getByText('Aptitude Mock')).toBeInTheDocument()
  })

  it('filters by status', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard />)
    await screen.findByText('Algebra Basics')

    await user.click(screen.getByRole('button', { name: 'live' }))

    expect(screen.queryByText('Algebra Basics')).not.toBeInTheDocument()
    expect(screen.getByText('Aptitude Mock')).toBeInTheDocument()
  })

  it('filters by type', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard />)
    await screen.findByText('Algebra Basics')

    await user.click(screen.getByTestId('type-filter'))
    const option = await screen.findByRole('option', { name: 'Mock Test' })
    await user.click(within(option).getByRole('button'))

    expect(screen.queryByText('Algebra Basics')).not.toBeInTheDocument()
    expect(screen.getByText('Aptitude Mock')).toBeInTheDocument()
  })

  it('paginates the table with default page size of 10', async () => {
    const user = userEvent.setup()
    withManyTests(15)
    renderWithProviders(<Dashboard />)
    await screen.findByText('Paged Test 1')

    // Page 1: 10 rows, last page-1 item present, page-2 item not yet.
    expect(screen.getByText('Paged Test 10')).toBeInTheDocument()
    expect(screen.queryByText('Paged Test 11')).not.toBeInTheDocument()
    expect(screen.getByText(/of/)).toHaveTextContent('15')

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    expect(await screen.findByText('Paged Test 11')).toBeInTheDocument()
    expect(screen.queryByText('Paged Test 1')).not.toBeInTheDocument()
    expect(screen.getByText('Paged Test 15')).toBeInTheDocument()
  })

  it('resets to page 1 when a filter changes', async () => {
    const user = userEvent.setup()
    withManyTests(15)
    renderWithProviders(<Dashboard />)
    await screen.findByText('Paged Test 1')

    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(await screen.findByText('Paged Test 11')).toBeInTheDocument()

    // Typing in search should snap back to page 1.
    await user.type(screen.getByLabelText(/search tests/i), 'Paged Test 1')
    expect(await screen.findByText('Paged Test 1')).toBeInTheDocument()
  })

  it('deletes a test after confirmation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Dashboard />)
    const row = (await screen.findByText('Algebra Basics')).closest('tr')!

    await user.click(within(row).getByRole('button', { name: 'Delete' }))

    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })
})
