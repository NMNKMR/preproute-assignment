import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { renderWithProviders } from '@tests/utils/renderWithProviders'
import { PreviewPublish } from '@/pages/PreviewPublish'
import { server } from '@tests/mocks/server'
import { questions as fixtureQuestions, tests as fixtureTests } from '@tests/mocks/fixtures'
import { API_BASE_URL } from '@/lib/env'

function renderPage(testId = 'test-2') {
  return renderWithProviders(
    <Routes>
      <Route path="/tests/:id/preview" element={<PreviewPublish />} />
      <Route path="/tests/:id/questions" element={<div>QUESTIONS PAGE</div>} />
      <Route path="/dashboard" element={<div>DASHBOARD</div>} />
    </Routes>,
    { route: `/tests/${testId}/preview` },
  )
}

/** Render a complete DRAFT test (2/2 questions) — publish controls show by default. */
function renderDraftTest() {
  server.use(
    http.get(`${API_BASE_URL}/tests/:id`, () =>
      HttpResponse.json({
        status: 'success',
        message: 'ok',
        data: {
          ...fixtureTests[1],
          id: 'test-draft',
          status: 'draft',
          total_questions: 2,
          questions: ['q1', 'q2'],
        },
      }),
    ),
  )
  return renderPage('test-draft')
}

describe('PreviewPublish', () => {
  it('shows one question at a time and navigates with the arrows', async () => {
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByText('Aptitude Mock')).toBeInTheDocument()

    expect(await screen.findByText(/what is 2 \+ 2\?/i)).toBeInTheDocument()
    expect(screen.queryByText(/capital of france\?/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next question' }))

    expect(await screen.findByText(/capital of france\?/i)).toBeInTheDocument()
    expect(screen.queryByText(/what is 2 \+ 2\?/i)).not.toBeInTheDocument()
  })

  it('lets the sidebar switch the visible question', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/what is 2 \+ 2\?/i)

    const rail = screen.getByText('Question creation').closest('aside')!
    await user.click(within(rail).getByText('Question 2'))

    expect(await screen.findByText(/capital of france\?/i)).toBeInTheDocument()
  })

  it('marks the correct option for the shown question', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText(/what is 2 \+ 2\?/i)
    await user.click(screen.getByRole('button', { name: 'Next question' }))

    const paris = await screen.findByText('Paris')
    expect(paris.closest('li')).toHaveClass('bg-emerald-50')
  })

  it('renders the question media image when present', async () => {
    renderPage()
    const img = await screen.findByRole('img', { name: /question 1 media/i })
    expect(img).toHaveAttribute('src', 'https://example.com/q1.png')
  })

  it('Edit navigates to the questions page', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Aptitude Mock')

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(await screen.findByText('QUESTIONS PAGE')).toBeInTheDocument()
  })

  it('shows the current status and schedule/expiry dates', async () => {
    server.use(
      http.get(`${API_BASE_URL}/tests/:id`, () =>
        HttpResponse.json({
          status: 'success',
          message: 'ok',
          data: {
            ...fixtureTests[1],
            id: 'test-sched',
            status: 'live',
            questions: ['q1'],
            scheduled_date: '2026-07-01T09:00:00.000Z',
            expiry_date: '2026-08-01T09:00:00.000Z',
          },
        }),
      ),
      http.post(`${API_BASE_URL}/questions/fetchBulk`, () =>
        HttpResponse.json({
          status: 'success',
          message: 'ok',
          data: [fixtureQuestions.q1],
        }),
      ),
    )
    renderPage('test-sched')
    await screen.findByText('Aptitude Mock')

    expect(screen.getByText('live')).toBeInTheDocument()
    expect(screen.getByText(/scheduled:/i)).toBeInTheDocument()
    expect(screen.getByText(/live until:/i)).toBeInTheDocument()
  })

  it('hides publish controls for a live test until Edit is clicked', async () => {
    const user = userEvent.setup()
    renderPage() // test-2 is live (2/2 questions)
    await screen.findByText('Aptitude Mock')

    // Controls hidden by default for a live test.
    expect(
      screen.queryByRole('button', { name: 'Publish Now' }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /edit publish settings/i }),
    )

    expect(screen.getByRole('button', { name: 'Publish Now' })).toBeInTheDocument()
    // A live test re-publishes via "Update".
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument()
  })

  it('reveals schedule pickers on the Schedule Publish tab', async () => {
    const user = userEvent.setup()
    renderDraftTest()
    await screen.findByText('Aptitude Mock')

    expect(screen.queryByLabelText('Schedule date')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /schedule publish/i }))
    expect(screen.getByLabelText('Schedule date')).toBeInTheDocument()
  })

  it('disables publish until all questions are added', async () => {
    server.use(
      http.get(`${API_BASE_URL}/tests/:id`, () =>
        HttpResponse.json({
          status: 'success',
          message: 'ok',
          data: {
            ...fixtureTests[1],
            id: 'test-partial',
            status: 'draft',
            total_questions: 3,
            questions: ['q1'],
          },
        }),
      ),
    )
    renderPage('test-partial')
    await screen.findByText('Aptitude Mock')

    expect(
      screen.getByText(/add all 3 questions to publish/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish Test' })).toBeDisabled()
  })

  it('publishes and redirects to the dashboard', async () => {
    const user = userEvent.setup()
    renderDraftTest()
    await screen.findByText('Aptitude Mock')

    await user.click(screen.getByRole('button', { name: 'Publish Test' }))
    expect(await screen.findByText('DASHBOARD')).toBeInTheDocument()
  })

  it('requires a date when scheduling', async () => {
    const user = userEvent.setup()
    renderDraftTest()
    await screen.findByText('Aptitude Mock')

    await user.click(screen.getByRole('button', { name: /schedule publish/i }))
    await user.click(screen.getByRole('button', { name: 'Schedule' }))
    // No date chosen -> stays on the page.
    expect(screen.queryByText('DASHBOARD')).not.toBeInTheDocument()
  })
})
