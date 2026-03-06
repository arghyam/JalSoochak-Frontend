import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { ViewStateUTAdminPage } from './view-state-ut-admin-page'
import { renderWithProviders } from '@/test/render-with-providers'
import { ROUTES } from '@/shared/constants/routes'
import type { StateUTAdmin } from '../../types/state-ut-admins'

const mockAdmin: StateUTAdmin = {
  id: 'admin-1',
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
  useParams: () => ({ id: 'admin-1' }),
}))

const mockUseStateUTAdminByIdQuery = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useStateUTAdminByIdQuery: () => mockUseStateUTAdminByIdQuery(),
}))

describe('ViewStateUTAdminPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseStateUTAdminByIdQuery.mockReturnValue({ data: mockAdmin, isLoading: false })
  })

  it('renders page title', () => {
    renderWithProviders(<ViewStateUTAdminPage />)
    expect(screen.getByRole('heading', { name: /state\/ut admins/i })).toBeTruthy()
  })

  it('renders loading state', () => {
    mockUseStateUTAdminByIdQuery.mockReturnValue({ data: undefined, isLoading: true })
    renderWithProviders(<ViewStateUTAdminPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders not found when admin is null', () => {
    mockUseStateUTAdminByIdQuery.mockReturnValue({ data: null, isLoading: false })
    renderWithProviders(<ViewStateUTAdminPage />)
    expect(screen.getByText('Admin not found')).toBeTruthy()
  })

  it('renders User Details section', () => {
    renderWithProviders(<ViewStateUTAdminPage />)
    expect(screen.getByText('User Details')).toBeTruthy()
  })

  it('displays all admin fields', () => {
    renderWithProviders(<ViewStateUTAdminPage />)
    expect(screen.getByText('Vijay')).toBeTruthy()
    expect(screen.getByText('Kumar')).toBeTruthy()
    expect(screen.getByText('vijay.kumar@gmail.com')).toBeTruthy()
    expect(screen.getByText('+91 85642-54517')).toBeTruthy()
  })

  it('displays status chip', () => {
    renderWithProviders(<ViewStateUTAdminPage />)
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('renders breadcrumb with manage link', () => {
    renderWithProviders(<ViewStateUTAdminPage />)
    expect(screen.getByText('Manage State/UT Admins')).toBeTruthy()
    expect(screen.getByText('View State/UT Admin')).toBeTruthy()
  })

  it('navigates to list when breadcrumb manage link is clicked', () => {
    renderWithProviders(<ViewStateUTAdminPage />)
    fireEvent.click(screen.getByText('Manage State/UT Admins'))
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.STATE_ADMIN_STATE_UT_ADMINS)
  })

  it('navigates to edit page when edit icon is clicked', () => {
    renderWithProviders(<ViewStateUTAdminPage />)
    const editButton = screen.getByRole('button', { name: /edit admin/i })
    fireEvent.click(editButton)
    expect(mockNavigate).toHaveBeenCalledWith(
      ROUTES.STATE_ADMIN_STATE_UT_ADMINS_EDIT.replace(':id', 'admin-1')
    )
  })

  it('renders error state with message and retry button', () => {
    mockUseStateUTAdminByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch admin'),
      refetch: jest.fn(),
    })
    renderWithProviders(<ViewStateUTAdminPage />)
    expect(screen.getByText('Failed to fetch admin')).toBeTruthy()
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })

  it('calls refetch when retry button is clicked', () => {
    const mockRefetch = jest.fn()
    mockUseStateUTAdminByIdQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: mockRefetch,
    })
    renderWithProviders(<ViewStateUTAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('displays inactive status chip for inactive admin', () => {
    mockUseStateUTAdminByIdQuery.mockReturnValue({
      data: { ...mockAdmin, status: 'inactive' },
      isLoading: false,
    })
    renderWithProviders(<ViewStateUTAdminPage />)
    expect(screen.getByText('Inactive')).toBeTruthy()
  })
})
