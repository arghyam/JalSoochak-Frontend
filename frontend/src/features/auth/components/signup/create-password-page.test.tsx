import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreatePasswordPage } from './create-password-page'
import { renderWithProviders } from '@/test/render-with-providers'
import { authApi, buildSetPasswordRequest } from '@/features/auth/services/auth-api'
import { ROUTES } from '@/shared/constants/routes'

const mockNavigate = jest.fn()
const mockUseParams = jest.fn(() => ({}))

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  }
})

jest.mock('@/features/auth/services/auth-api', () => ({
  authApi: {
    getUserByInviteId: jest.fn(),
    createPassword: jest.fn(),
  },
  buildSetPasswordRequest: jest.fn((p: unknown) => p),
}))

jest.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toasts: [],
    removeToast: jest.fn(),
    addToast: jest.fn(),
  }),
}))

const authMock = authApi as unknown as {
  getUserByInviteId: jest.Mock
  createPassword: jest.Mock
}

describe('CreatePasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({})
  })

  it('shows error when invite id is missing', async () => {
    mockUseParams.mockReturnValue({})
    renderWithProviders(<CreatePasswordPage onShowToast={jest.fn()} />)
    await waitFor(() =>
      expect(screen.getByText('Invalid or expired invite link.')).toBeInTheDocument()
    )
  })

  it('loads email and enables submit when password rules pass', async () => {
    mockUseParams.mockReturnValue({ id: 'user-1' })
    authMock.getUserByInviteId.mockResolvedValue({ email: 'a@test.com' })
    const user = userEvent.setup()
    renderWithProviders(<CreatePasswordPage onShowToast={jest.fn()} />)
    await waitFor(() => expect(screen.getByDisplayValue('a@test.com')).toBeInTheDocument())
    const pwdInputs = screen.getAllByPlaceholderText('Enter your password')
    await user.type(pwdInputs[0], 'Aa1@abcdef')
    await user.type(pwdInputs[1], 'Aa1@abcdef')
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('submits create password and navigates to login on success', async () => {
    const onShowToast = jest.fn()
    mockUseParams.mockReturnValue({ id: 'user-1' })
    authMock.getUserByInviteId.mockResolvedValue({ email: 'a@test.com' })
    authMock.createPassword.mockResolvedValue({ message: 'ok' })
    const user = userEvent.setup()
    renderWithProviders(<CreatePasswordPage onShowToast={onShowToast} />)
    await waitFor(() => expect(screen.getByDisplayValue('a@test.com')).toBeInTheDocument())
    const pwdInputs = screen.getAllByPlaceholderText('Enter your password')
    await user.type(pwdInputs[0], 'Aa1@abcdef')
    await user.type(pwdInputs[1], 'Aa1@abcdef')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(authMock.createPassword).toHaveBeenCalled())
    expect(buildSetPasswordRequest).toHaveBeenCalled()
    expect(onShowToast).toHaveBeenCalledWith(expect.any(String), 'success')
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith(ROUTES.LOGIN)
      },
      { timeout: 5000 }
    )
  })
})
