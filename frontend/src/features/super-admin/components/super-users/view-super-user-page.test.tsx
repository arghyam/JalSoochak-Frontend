import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { ViewSuperUserPage } from './view-super-user-page'
import { renderWithProviders } from '@/test/render-with-providers'
import { ROUTES } from '@/shared/constants/routes'
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

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'user-1' }),
}))

const mockUseSuperUserByIdQuery = jest.fn()

jest.mock('../../services/query/use-super-admin-queries', () => ({
  useSuperUserByIdQuery: () => mockUseSuperUserByIdQuery(),
}))

describe('ViewSuperUserPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseSuperUserByIdQuery.mockReturnValue({ data: mockUser, isLoading: false })
  })

  it('renders page title', () => {
    renderWithProviders(<ViewSuperUserPage />)
    expect(screen.getByRole('heading', { name: /super users/i })).toBeTruthy()
  })

  it('renders loading state', () => {
    mockUseSuperUserByIdQuery.mockReturnValue({ data: undefined, isLoading: true })
    renderWithProviders(<ViewSuperUserPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders not found when user is null', () => {
    mockUseSuperUserByIdQuery.mockReturnValue({ data: null, isLoading: false })
    renderWithProviders(<ViewSuperUserPage />)
    expect(screen.getByText('Super user not found')).toBeTruthy()
  })

  it('renders User Details section', () => {
    renderWithProviders(<ViewSuperUserPage />)
    expect(screen.getByText('User Details')).toBeTruthy()
  })

  it('displays all user fields', () => {
    renderWithProviders(<ViewSuperUserPage />)
    expect(screen.getByText('Vijay')).toBeTruthy()
    expect(screen.getByText('Kumar')).toBeTruthy()
    expect(screen.getByText('vijay.kumar@gmail.com')).toBeTruthy()
    expect(screen.getByText('+91 85642-54517')).toBeTruthy()
  })

  it('displays status chip', () => {
    renderWithProviders(<ViewSuperUserPage />)
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('renders breadcrumb with manage link', () => {
    renderWithProviders(<ViewSuperUserPage />)
    expect(screen.getByText('Manages Super Users')).toBeTruthy()
    expect(screen.getByText('View Super User')).toBeTruthy()
  })

  it('navigates to list when breadcrumb manage link is clicked', () => {
    renderWithProviders(<ViewSuperUserPage />)
    fireEvent.click(screen.getByText('Manages Super Users'))
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SUPER_ADMIN_SUPER_USERS)
  })

  it('navigates to edit page when edit icon is clicked', () => {
    renderWithProviders(<ViewSuperUserPage />)
    const editButton = screen.getByRole('button', { name: /edit super user/i })
    fireEvent.click(editButton)
    expect(mockNavigate).toHaveBeenCalledWith(
      ROUTES.SUPER_ADMIN_SUPER_USERS_EDIT.replace(':id', 'user-1')
    )
  })

  it('renders error state with message and retry button', () => {
    mockUseSuperUserByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch user'),
      refetch: jest.fn(),
    })
    renderWithProviders(<ViewSuperUserPage />)
    expect(screen.getByText('Failed to fetch user')).toBeTruthy()
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })

  it('calls refetch when retry button is clicked', () => {
    const mockRefetch = jest.fn()
    mockUseSuperUserByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: mockRefetch,
    })
    renderWithProviders(<ViewSuperUserPage />)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('displays inactive status chip for inactive user', () => {
    mockUseSuperUserByIdQuery.mockReturnValue({
      data: { ...mockUser, status: 'inactive' },
      isLoading: false,
    })
    renderWithProviders(<ViewSuperUserPage />)
    expect(screen.getByText('Inactive')).toBeTruthy()
  })
})
