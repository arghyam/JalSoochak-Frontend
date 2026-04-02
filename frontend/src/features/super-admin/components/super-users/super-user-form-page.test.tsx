import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { SuperUserFormPage } from './super-user-form-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { SuperUser } from '../../types/super-users'

const mockUser: SuperUser = {
  id: 'user-1',
  firstName: 'Vijay',
  lastName: 'Kumar',
  email: 'vijay.kumar@gmail.com',
  phone: '8564254517',
  status: 'active',
}

const mockNavigate = jest.fn()
const mockUseParams = jest.fn<() => { id: string | undefined }>().mockReturnValue({ id: undefined })

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}))

const mockUseSuperUserByIdQuery = jest.fn()
const mockUseUpdateUserMutation = jest.fn()
const mockUseUpdateUserStatusMutation = jest.fn()

jest.mock('../../services/query/use-super-admin-queries', () => ({
  useSuperUserByIdQuery: () => mockUseSuperUserByIdQuery(),
  useUpdateUserMutation: () => mockUseUpdateUserMutation(),
  useUpdateUserStatusMutation: () => mockUseUpdateUserStatusMutation(),
}))

const makeMutationMock = () => ({
  mutateAsync: jest.fn<() => Promise<SuperUser>>().mockResolvedValue(mockUser),
  isPending: false,
})

describe('SuperUserFormPage — Add Mode', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseParams.mockReturnValue({ id: undefined })
    mockUseSuperUserByIdQuery.mockReturnValue({ data: undefined, isLoading: false })
    mockUseUpdateUserMutation.mockReturnValue(makeMutationMock())
    mockUseUpdateUserStatusMutation.mockReturnValue(makeMutationMock())
  })

  it('renders add title', () => {
    renderWithProviders(<SuperUserFormPage />)
    expect(screen.getByRole('heading', { name: /add super user/i })).toBeTruthy()
  })

  it('renders User Details section heading', () => {
    renderWithProviders(<SuperUserFormPage />)
    expect(screen.getByText('User Details')).toBeTruthy()
  })

  it('renders all four required fields', () => {
    renderWithProviders(<SuperUserFormPage />)
    expect(screen.getByLabelText(/first name/i)).toBeTruthy()
    expect(screen.getByLabelText(/last name/i)).toBeTruthy()
    expect(screen.getByLabelText(/email address/i)).toBeTruthy()
    expect(screen.getByLabelText(/phone number/i)).toBeTruthy()
  })

  it('submit button is disabled when form is empty', () => {
    renderWithProviders(<SuperUserFormPage />)
    const submitBtn = screen.getByRole('button', {
      name: /add super user & send link via email/i,
    })
    expect(submitBtn).toBeTruthy()
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('submit button is enabled when form is valid', () => {
    renderWithProviders(<SuperUserFormPage />)
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Vijay' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Kumar' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'vijay@gmail.com' },
    })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '8564254517' } })
    const submitBtn = screen.getByRole('button', {
      name: /add super user & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('does not show status toggle in add mode', () => {
    renderWithProviders(<SuperUserFormPage />)
    expect(screen.queryByText('Activated')).toBeNull()
  })

  it('navigates to list on Cancel click', () => {
    renderWithProviders(<SuperUserFormPage />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/super-user/super-users')
  })
})

describe('SuperUserFormPage — Edit Mode', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseParams.mockReturnValue({ id: 'user-1' })
    mockUseSuperUserByIdQuery.mockReturnValue({ data: mockUser, isLoading: false })
    mockUseUpdateUserMutation.mockReturnValue(makeMutationMock())
    mockUseUpdateUserStatusMutation.mockReturnValue(makeMutationMock())
  })

  it('renders edit title', () => {
    renderWithProviders(<SuperUserFormPage />)
    expect(screen.getByRole('heading', { name: /edit super user/i })).toBeTruthy()
  })

  it('renders loading state while fetching user', () => {
    mockUseSuperUserByIdQuery.mockReturnValue({ data: undefined, isLoading: true })
    renderWithProviders(<SuperUserFormPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders not found state when user is missing', () => {
    mockUseSuperUserByIdQuery.mockReturnValue({ data: null, isLoading: false })
    renderWithProviders(<SuperUserFormPage />)
    expect(screen.getByText('Super user not found')).toBeTruthy()
  })

  it('email field is read-only in edit mode', async () => {
    renderWithProviders(<SuperUserFormPage />)
    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
    await userEvent.type(emailInput, 'new@example.com')
    expect(emailInput.value).toBe(mockUser.email)
  })

  it('shows status toggle in edit mode', () => {
    renderWithProviders(<SuperUserFormPage />)
    expect(screen.getByText('Activated')).toBeTruthy()
  })

  it('shows Save Changes button in edit mode', () => {
    renderWithProviders(<SuperUserFormPage />)
    expect(screen.getByRole('button', { name: /save changes/i })).toBeTruthy()
  })

  it('navigates to view page on Cancel click in edit mode', () => {
    renderWithProviders(<SuperUserFormPage />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/super-user/super-users/user-1')
  })
})
