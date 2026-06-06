import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Login } from '@/pages/Login'
import { renderWithProviders } from '@tests/utils/renderWithProviders'
import { getToken } from '@/features/auth/storage'

describe('Login', () => {
  it('shows validation errors when submitting empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />, { route: '/login' })

    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(await screen.findByText(/user id is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })

  it('stores the JWT after a successful login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />, { route: '/login' })

    await user.type(screen.getByLabelText(/user id/i), 'vedant-admin')
    await user.type(screen.getByLabelText('Password'), 'vedant123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => expect(getToken()).toBe('test-jwt-token'))
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />, { route: '/login' })

    const pw = screen.getByLabelText('Password')
    expect(pw).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: /show password/i }))
    expect(pw).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: /hide password/i }))
    expect(pw).toHaveAttribute('type', 'password')
  })

  it('surfaces an error message on bad credentials', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Login />, { route: '/login' })

    await user.type(screen.getByLabelText(/user id/i), 'wrong')
    await user.type(screen.getByLabelText('Password'), 'creds')
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })
})
