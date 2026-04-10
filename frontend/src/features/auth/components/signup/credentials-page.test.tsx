import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CredentialsPage } from './credentials-page'
import { renderWithProviders } from '@/test/render-with-providers'
import { authApi, buildUpdateProfileRequest } from '@/features/auth/services/auth-api'
import { ROUTES } from '@/shared/constants/routes'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

jest.mock('@/features/auth/services/auth-api', () => ({
  authApi: {
    getUserProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
  buildUpdateProfileRequest: jest.fn((p: unknown) => p),
}))

const authMock = authApi as unknown as {
  getUserProfile: jest.Mock
  updateProfile: jest.Mock
}

describe('CredentialsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authMock.getUserProfile.mockResolvedValue({
      firstName: 'Jane',
      lastName: 'Doe',
      primaryNumber: '9876543210',
      primaryEmail: 'jane@test.com',
      role: 'stateadmin',
      tenantCode: 'TC',
    })
    authMock.updateProfile.mockResolvedValue({})
  })

  it('loads profile and shows form when userId is present', async () => {
    renderWithProviders(<CredentialsPage email="x@test.com" userId="u1" onShowToast={jest.fn()} />)
    expect(await screen.findByDisplayValue('Jane')).toBeInTheDocument()
    expect(screen.getByText('Complete your profile information.')).toBeInTheDocument()
    expect(authMock.getUserProfile).toHaveBeenCalledWith('u1')
  })

  it('shows error state when profile fetch fails', async () => {
    authMock.getUserProfile.mockRejectedValue(new Error('network down'))
    renderWithProviders(<CredentialsPage email="x@test.com" userId="u1" onShowToast={jest.fn()} />)
    await waitFor(() => expect(screen.getByText('network down')).toBeInTheDocument())
  })

  it('submits profile update and navigates to login on success', async () => {
    const onShowToast = jest.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <CredentialsPage email="x@test.com" userId="u1" onShowToast={onShowToast} />
    )
    await screen.findByDisplayValue('Jane')
    const nameInputs = screen.getAllByPlaceholderText('Enter')
    await user.clear(nameInputs[0])
    await user.type(nameInputs[0], 'Ann')
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    await waitFor(() => expect(authMock.updateProfile).toHaveBeenCalled())
    expect(buildUpdateProfileRequest).toHaveBeenCalled()
    expect(onShowToast).toHaveBeenCalledWith(expect.any(String), 'success')
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith(ROUTES.LOGIN)
      },
      { timeout: 5000 }
    )
  })

  it('shows toast when userId is missing on submit', async () => {
    const onShowToast = jest.fn()
    renderWithProviders(<CredentialsPage email="x@test.com" userId="" onShowToast={onShowToast} />)
    const nameInputs = screen.getAllByPlaceholderText('Enter')
    fireEvent.change(nameInputs[0], { target: { value: 'Only' } })
    fireEvent.change(screen.getByPlaceholderText('+91'), { target: { value: '9876543210' } })
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    await waitFor(() => {
      expect(onShowToast).toHaveBeenCalledWith(expect.any(String), 'error')
    })
    expect(authMock.updateProfile).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
