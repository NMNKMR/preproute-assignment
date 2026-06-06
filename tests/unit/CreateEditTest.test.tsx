import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateEditTest } from '@/pages/CreateEditTest'
import { renderWithProviders } from '@tests/utils/renderWithProviders'

describe('CreateEditTest (create mode)', () => {
  it('shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateEditTest />)
    // wait for subjects to load
    await screen.findByText('Marking Scheme:')

    // Clear the prefilled name so the required check fires.
    await user.clear(screen.getByLabelText('Name of Test'))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByText(/test name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/subject is required/i)).toBeInTheDocument()
    expect(screen.getByText(/select at least one topic/i)).toBeInTheDocument()
  })

  async function pickSubject(
    user: ReturnType<typeof userEvent.setup>,
    name: string,
  ) {
    await user.click(screen.getByTestId('subject-select'))
    await user.click(await screen.findByText(name))
  }

  it('loads topics after a subject is chosen (cascade)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateEditTest />)
    await screen.findByText('Marking Scheme:')

    await pickSubject(user, 'English')

    // Topic dropdown becomes enabled; opening it shows the subject's topics.
    const trigger = screen.getByTestId('topic-select')
    await waitFor(() => expect(trigger).not.toBeDisabled())
    await user.click(trigger)

    expect(await screen.findByText('Grammar')).toBeInTheDocument()
    expect(screen.getByText('Vocabulary')).toBeInTheDocument()
  })

  it('resets topics when the subject changes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateEditTest />)
    await screen.findByText('Marking Scheme:')

    await pickSubject(user, 'English')
    const topicGroup = screen.getByText('Topic').parentElement!
    const trigger = screen.getByTestId('topic-select')
    await waitFor(() => expect(trigger).not.toBeDisabled())
    await user.click(trigger)
    await user.click(await screen.findByText('Grammar'))
    // chip selected (option may still be visible in the open list too)
    expect(within(topicGroup).getAllByText('Grammar').length).toBeGreaterThan(0)

    // Switch subject -> topics cleared, dropdown disabled again.
    await pickSubject(user, 'General Aptitude Test')
    await waitFor(() =>
      expect(within(topicGroup).queryByText('Grammar')).not.toBeInTheDocument(),
    )
  })
})
