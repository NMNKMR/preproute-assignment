import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders } from '@tests/utils/renderWithProviders'
import { AddQuestions } from '@/pages/AddQuestions'

// react-quill-new needs a real DOM selection API; stub it with a textarea.
vi.mock('react-quill-new', () => ({
  default: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
  }) => (
    <textarea
      data-testid="question-editor"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

function renderPage(testId = 'test-1') {
  return renderWithProviders(
    <Routes>
      <Route path="/tests/:id/questions" element={<AddQuestions />} />
      <Route path="/tests/:id/preview" element={<div>PREVIEW PAGE</div>} />
    </Routes>,
    { route: `/tests/${testId}/questions` },
  )
}

describe('AddQuestions', () => {
  it('renders the test summary header', async () => {
    renderPage()
    expect(await screen.findByText('Algebra Basics')).toBeInTheDocument()
    expect(screen.getByText(/total questions/i)).toBeInTheDocument()
  })

  it('adds a question to the list rail', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Algebra Basics')

    const rail = screen.getByText('Question creation').closest('aside')!
    expect(within(rail).getByText('Question 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /add question/i }))
    expect(within(rail).getByText('Question 2')).toBeInTheDocument()
  })

  it('blocks saving when no question is filled in', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Algebra Basics')

    await user.click(screen.getByRole('button', { name: /save & publish/i }))
    // Still on the questions page (no navigation to preview).
    expect(screen.queryByText('PREVIEW PAGE')).not.toBeInTheDocument()
  })

  it('saves a complete question and navigates to preview', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Algebra Basics')

    await user.type(screen.getByTestId('question-editor'), 'What is 2 + 2?')
    await user.type(screen.getByLabelText('Option 1'), '3')
    await user.type(screen.getByLabelText('Option 2'), '4')
    await user.type(screen.getByLabelText('Option 3'), '5')
    await user.type(screen.getByLabelText('Option 4'), '6')
    await user.click(screen.getByLabelText('Mark option 2 correct'))

    await user.click(screen.getByRole('button', { name: /save & publish/i }))

    expect(await screen.findByText('PREVIEW PAGE')).toBeInTheDocument()
  })

  it('"Next" adds the next question instead of saving', async () => {
    const user = userEvent.setup()
    renderPage() // test-1: total_questions 10, so room to add
    await screen.findByText('Algebra Basics')

    // Complete the first question, then Next should add a second draft.
    await user.type(screen.getByTestId('question-editor'), 'Q1?')
    await user.type(screen.getByLabelText('Option 1'), 'a')
    await user.type(screen.getByLabelText('Option 2'), 'b')
    await user.type(screen.getByLabelText('Option 3'), 'c')
    await user.type(screen.getByLabelText('Option 4'), 'd')
    await user.click(screen.getByLabelText('Mark option 1 correct'))

    await user.click(screen.getByRole('button', { name: 'Next' }))

    const rail = screen.getByText('Question creation').closest('aside')!
    expect(within(rail).getByText('Question 2')).toBeInTheDocument()
    // Did not navigate away to preview.
    expect(screen.queryByText('PREVIEW PAGE')).not.toBeInTheDocument()
  })

  it('hydrates existing questions when editing a test that has them', async () => {
    renderPage('test-2') // fixture test-2 has questions q1, q2
    await screen.findByText('Aptitude Mock')

    // First existing question is loaded into the editor + options.
    await waitFor(() =>
      expect(screen.getByLabelText('Option 1')).toHaveValue('3'),
    )
    expect(screen.getByTestId('question-editor')).toHaveValue(
      '<p>What is 2 + 2?</p>',
    )
    const rail = screen.getByText('Question creation').closest('aside')!
    expect(within(rail).getByText('Question 1')).toBeInTheDocument()
    expect(within(rail).getByText('Question 2')).toBeInTheDocument()
  })

  it('clears a single field with its clear button', async () => {
    const user = userEvent.setup()
    renderPage('test-2')
    await waitFor(() =>
      expect(screen.getByLabelText('Option 1')).toHaveValue('3'),
    )

    await user.click(screen.getByRole('button', { name: 'Clear option 1' }))
    expect(screen.getByLabelText('Option 1')).toHaveValue('')
  })

  it('clears the whole question with Delete All Edits', async () => {
    const user = userEvent.setup()
    renderPage('test-2')
    await waitFor(() =>
      expect(screen.getByLabelText('Option 1')).toHaveValue('3'),
    )

    await user.click(screen.getByRole('button', { name: /delete all edits/i }))

    expect(screen.getByTestId('question-editor')).toHaveValue('')
    expect(screen.getByLabelText('Option 1')).toHaveValue('')
    expect(screen.getByLabelText('Option 2')).toHaveValue('')
  })

  it('imports questions from a CSV file', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Algebra Basics')

    const csv = [
      'question,option1,option2,option3,option4,correct_option',
      '"What is 2 + 2?",3,4,5,6,2',
      '"Capital of France?",Berlin,Madrid,Paris,Rome,C',
    ].join('\n')
    const file = new File([csv], 'questions.csv', { type: 'text/csv' })

    await user.upload(screen.getByLabelText('Import questions CSV'), file)

    // First imported question is shown; both land in the rail.
    await waitFor(() =>
      expect(screen.getByLabelText('Option 2')).toHaveValue('4'),
    )
    expect(screen.getByTestId('question-editor')).toHaveValue(
      '<p>What is 2 + 2?</p>',
    )
    const rail = screen.getByText('Question creation').closest('aside')!
    expect(within(rail).getByText('Question 1')).toBeInTheDocument()
    expect(within(rail).getByText('Question 2')).toBeInTheDocument()
  })
})
