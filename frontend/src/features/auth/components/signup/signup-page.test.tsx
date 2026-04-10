import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupPage } from './signup-page'
import { renderWithProviders } from '@/test/render-with-providers'

describe('SignupPage', () => {
  it('renders welcome copy', () => {
    renderWithProviders(<SignupPage onSuccess={jest.fn()} />)
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('Please enter your details.')).toBeInTheDocument()
  })

  it('shows error when credentials do not match hardcoded demo user', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignupPage onSuccess={jest.fn()} />)
    await user.type(screen.getByPlaceholderText('Enter your user ID'), 'wrong')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'a@b.com')
    await user.type(screen.getByPlaceholderText('Enter your password'), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    expect(screen.getByText('User ID or password is incorrect.')).toBeInTheDocument()
  })

  it('calls onSuccess with trimmed email when demo credentials match', async () => {
    const onSuccess = jest.fn()
    const user = userEvent.setup()
    renderWithProviders(<SignupPage onSuccess={onSuccess} />)
    await user.type(screen.getByPlaceholderText('Enter your user ID'), 'demo.user')
    await user.type(screen.getByPlaceholderText('Enter your email'), '  user@test.com  ')
    await user.type(screen.getByPlaceholderText('Enter your password'), '1234567')
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    expect(onSuccess).toHaveBeenCalledWith('user@test.com')
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignupPage onSuccess={jest.fn()} />)
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    expect(passwordInput).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(passwordInput).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
