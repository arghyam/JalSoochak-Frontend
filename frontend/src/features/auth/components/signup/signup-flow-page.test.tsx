import { screen, waitFor } from '@testing-library/react'
import { SignupFlowPage } from './signup-flow-page'
import { renderWithProviders } from '@/test/render-with-providers'
import { authApi } from '@/features/auth/services/auth-api'

const mockUseParams = jest.fn(() => ({}))

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => mockUseParams(),
  }
})

jest.mock('@/features/auth/services/auth-api', () => ({
  authApi: {
    getUserByInviteId: jest.fn(),
  },
}))

jest.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toasts: [],
    removeToast: jest.fn(),
    addToast: jest.fn(),
  }),
}))

const authMock = authApi as unknown as { getUserByInviteId: jest.Mock }

describe('SignupFlowPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({})
    authMock.getUserByInviteId.mockReset()
  })

  it('renders signup step with logo and welcome form by default', () => {
    renderWithProviders(<SignupFlowPage />)
    expect(screen.getByRole('img', { name: /jalsoochak logo/i })).toBeInTheDocument()
    expect(screen.getByText('Welcome')).toBeInTheDocument()
  })

  it('renders create-password form after invite loads when initialStep is createPassword', async () => {
    mockUseParams.mockReturnValue({ id: 'invite-1' })
    authMock.getUserByInviteId.mockResolvedValue({ email: 'invited@test.com' })
    renderWithProviders(<SignupFlowPage initialStep="createPassword" />)
    await waitFor(() => expect(screen.getByDisplayValue('invited@test.com')).toBeInTheDocument())
    expect(screen.getByText('Create a password to proceed further.')).toBeInTheDocument()
  })

  it('renders credentials step with profile heading when initialStep is credentials', () => {
    renderWithProviders(<SignupFlowPage initialStep="credentials" />)
    expect(screen.getByText('Profile Details')).toBeInTheDocument()
    expect(screen.getByText('Complete your profile information.')).toBeInTheDocument()
  })
})
