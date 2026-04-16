import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { AccountActivationPage } from './activate-account-page'
import { authApi } from '@/features/auth/services/auth-api'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('token=test-token')],
  }
})
jest.mock('@/features/auth/services/auth-api', () => ({
  authApi: { getInviteInfo: jest.fn(), activateAccount: jest.fn() },
}))
jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: (selector: (state: { setFromActivation: (x: unknown) => string }) => unknown) =>
    selector({ setFromActivation: () => '/dashboard' }),
}))
jest.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({ toasts: [], removeToast: jest.fn(), addToast: jest.fn() }),
}))

describe('AccountActivationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('loads invite and enables next after valid password inputs', async () => {
    ;(authApi.getInviteInfo as jest.Mock).mockResolvedValue({
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '9999999999',
      role: 'STATE_ADMIN',
      tenantName: 'X',
    })
    renderWithProviders(<AccountActivationPage />)
    await waitFor(() => expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument())
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'Aa1@abcd' },
    })
    fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), {
      target: { value: 'Aa1@abcd' },
    })
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('shows fetch error when invite lookup fails', async () => {
    ;(authApi.getInviteInfo as jest.Mock).mockRejectedValue(new Error('Invite expired'))

    renderWithProviders(<AccountActivationPage />)

    expect(await screen.findByText('Invite expired')).toBeInTheDocument()
  })

  it('submits activation payload and navigates after success', async () => {
    jest.useFakeTimers()
    try {
      ;(authApi.getInviteInfo as jest.Mock).mockResolvedValue({
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        phoneNumber: '9999999999',
      })
      ;(authApi.activateAccount as jest.Mock).mockResolvedValue({ accessToken: 'token' })

      renderWithProviders(<AccountActivationPage />)

      await waitFor(() => expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument())

      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'Aa1@abcd' },
      })
      fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), {
        target: { value: 'Aa1@abcd' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Next' }))

      fireEvent.click(screen.getByRole('button', { name: 'Activate Account' }))

      await waitFor(() =>
        expect(authApi.activateAccount).toHaveBeenCalledWith({
          inviteToken: 'test-token',
          firstName: 'Jane',
          lastName: 'Doe',
          phoneNumber: '9999999999',
          password: 'Aa1@abcd',
        })
      )

      jest.advanceTimersByTime(1000)
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    } finally {
      jest.useRealTimers()
    }
  })
})
