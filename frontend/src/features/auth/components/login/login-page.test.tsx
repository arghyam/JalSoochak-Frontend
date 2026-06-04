import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { LoginPage } from './login-page'

const mockNavigate = jest.fn()
const mockLogin = jest.fn()
const mockLocationState: { state: Record<string, unknown> | null } = { state: null }

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocationState,
  }
})
jest.mock('@/app/store', () => ({
  useAuthStore: () => ({ login: mockLogin, loading: false, error: null }),
}))
jest.mock('@/features/auth/components/login/forgot-password-modal', () => ({
  ForgotPasswordModal: () => null,
}))

describe('LoginPage', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('shows email required validation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('Email is required.')).toBeInTheDocument()
  })

  it('submits valid credentials and navigates', async () => {
    mockLogin.mockResolvedValue('/next')
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    await user.type(screen.getByPlaceholderText('Enter your email'), 'user@test.com')
    await user.type(screen.getByPlaceholderText('Enter your password'), 'pass')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(mockLogin).toHaveBeenCalledWith({ email: 'user@test.com', password: 'pass' })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/next', { replace: true })
    })
  })

  it('shows password-changed alert when navigated with passwordChanged state', () => {
    mockLocationState.state = { passwordChanged: true }
    renderWithProviders(<LoginPage />)
    expect(
      screen.getByText('Password updated successfully. Please log in again.')
    ).toBeInTheDocument()
  })

  it('does not show password-changed alert when there is no location state', () => {
    mockLocationState.state = null
    renderWithProviders(<LoginPage />)
    expect(
      screen.queryByText('Password updated successfully. Please log in again.')
    ).not.toBeInTheDocument()
  })

  it('stale server error clears on re-submit', async () => {
    // Arrange: first call fails, second call succeeds
    mockLogin
      .mockRejectedValueOnce(new Error('invalid credentials'))
      .mockResolvedValueOnce('/dashboard')
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    await user.type(screen.getByPlaceholderText('Enter your email'), 'user@test.com')
    await user.type(screen.getByPlaceholderText('Enter your password'), 'wrongpass')

    // Act: first submit — should show error
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() => {
      expect(screen.getByText('Unable to login. Please try again.')).toBeInTheDocument()
    })

    // Act: second submit (valid) — error should disappear while submitting
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() => {
      expect(screen.queryByText('Unable to login. Please try again.')).not.toBeInTheDocument()
    })
  })

  it('Zod validation fires client-side without API call on empty email', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    // Only fill password, leave email empty
    await user.type(screen.getByPlaceholderText('Enter your password'), 'somepass')

    // Act
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    // Assert: client-side error shown, no API call made
    await waitFor(() => {
      expect(screen.getByText('Email is required.')).toBeInTheDocument()
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('password visibility toggle switches input type between password and text', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    const passwordInput = screen.getByPlaceholderText('Enter your password')

    // Assert initial state: type is password
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Act: click show password
    await user.click(screen.getByRole('button', { name: 'Show password' }))

    // Assert: type is now text
    expect(passwordInput).toHaveAttribute('type', 'text')

    // Act: click hide password
    await user.click(screen.getByRole('button', { name: 'Hide password' }))

    // Assert: type is back to password
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
