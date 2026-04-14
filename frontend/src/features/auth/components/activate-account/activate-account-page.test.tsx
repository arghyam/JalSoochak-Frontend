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
})
