import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/render-with-providers'
import { LoginPage } from './login-page'

const mockNavigate = jest.fn()
const mockLogin = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
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
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
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
})
