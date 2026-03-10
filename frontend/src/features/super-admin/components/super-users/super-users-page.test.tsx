import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { SuperUsersPage } from './super-users-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { SuperUser } from '../../types/super-users'

const mockUsers: SuperUser[] = [
  {
    id: 'user-1',
    firstName: 'Ravi',
    lastName: 'Kumar',
    email: 'ravi@gmail.com',
    phone: '9845285564',
    status: 'active',
  },
  {
    id: 'user-2',
    firstName: 'Sanjeev',
    lastName: 'Kumar',
    email: 'sanjeev@gmail.com',
    phone: '8765490123',
    status: 'inactive',
  },
]

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockUseSuperUsersQuery = jest.fn()

jest.mock('../../services/query/use-super-admin-queries', () => ({
  useSuperUsersQuery: () => mockUseSuperUsersQuery(),
}))

describe('SuperUsersPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseSuperUsersQuery.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
  })

  it('renders the page title', () => {
    renderWithProviders(<SuperUsersPage />)
    expect(screen.getByRole('heading', { name: /super users/i })).toBeTruthy()
  })

  it('renders loading state', () => {
    mockUseSuperUsersQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    })
    renderWithProviders(<SuperUsersPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders error state with retry button', () => {
    mockUseSuperUsersQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    })
    renderWithProviders(<SuperUsersPage />)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })

  it('renders all user rows', () => {
    renderWithProviders(<SuperUsersPage />)
    expect(screen.getByText('Ravi Kumar')).toBeTruthy()
    expect(screen.getByText('Sanjeev Kumar')).toBeTruthy()
    expect(screen.getByText('ravi@gmail.com')).toBeTruthy()
    expect(screen.getByText('sanjeev@gmail.com')).toBeTruthy()
  })

  it('renders table column headers', () => {
    renderWithProviders(<SuperUsersPage />)
    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.getByText('Mobile Number')).toBeTruthy()
    expect(screen.getByText('Email Address')).toBeTruthy()
    expect(screen.getByText('Status')).toBeTruthy()
    expect(screen.getByText('Actions')).toBeTruthy()
  })

  it('formats phone numbers with +91 prefix and dash', () => {
    renderWithProviders(<SuperUsersPage />)
    expect(screen.getByText('+91 98452-85564')).toBeTruthy()
  })

  it('filters users by name search', () => {
    renderWithProviders(<SuperUsersPage />)
    const searchInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(searchInput, { target: { value: 'Ravi' } })
    expect(screen.getByText('Ravi Kumar')).toBeTruthy()
    expect(screen.queryByText('Sanjeev Kumar')).toBeNull()
  })

  it('shows empty message when no results match search', () => {
    renderWithProviders(<SuperUsersPage />)
    const searchInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(searchInput, { target: { value: 'zzznomatch' } })
    expect(screen.getByText('No super users found')).toBeTruthy()
  })

  it('navigates to add page when Add Super User button is clicked', () => {
    renderWithProviders(<SuperUsersPage />)
    fireEvent.click(screen.getByRole('button', { name: /add super user/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/super-admin/super-users/add')
  })

  it('navigates to view page when view icon is clicked', () => {
    renderWithProviders(<SuperUsersPage />)
    const viewButtons = screen.getAllByRole('button', { name: /view super user/i })
    fireEvent.click(viewButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/super-admin/super-users/user-1')
  })

  it('navigates to edit page when edit icon is clicked', () => {
    renderWithProviders(<SuperUsersPage />)
    const editButtons = screen.getAllByRole('button', { name: /edit super user/i })
    fireEvent.click(editButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/super-admin/super-users/user-1/edit')
  })
})
