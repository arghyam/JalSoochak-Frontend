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
  {
    id: 'user-3',
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya@gmail.com',
    phone: '7654321098',
    status: 'pending',
  },
]

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockUseSuperUsersQuery = jest.fn()
const mockReinviteMutate = jest.fn()

jest.mock('../../services/query/use-super-admin-queries', () => ({
  useSuperUsersQuery: () => mockUseSuperUsersQuery(),
  useReinviteSuperUserMutation: () => ({ mutate: mockReinviteMutate }),
}))

describe('SuperUsersPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockReinviteMutate.mockReset()
    mockUseSuperUsersQuery.mockReturnValue({
      data: { items: mockUsers, total: mockUsers.length },
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

  it('does not render a search input', () => {
    renderWithProviders(<SuperUsersPage />)
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('navigates to add page when Add Super User button is clicked', () => {
    renderWithProviders(<SuperUsersPage />)
    fireEvent.click(screen.getByRole('button', { name: /add super user/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/super-user/super-users/add')
  })

  it('navigates to view page when view icon is clicked', () => {
    renderWithProviders(<SuperUsersPage />)
    const viewButtons = screen.getAllByRole('button', { name: /view super user/i })
    fireEvent.click(viewButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/super-user/super-users/user-1')
  })

  it('navigates to edit page when edit icon is clicked', () => {
    renderWithProviders(<SuperUsersPage />)
    const editButtons = screen.getAllByRole('button', { name: /edit super user/i })
    fireEvent.click(editButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/super-user/super-users/user-1/edit')
  })

  it('renders resend invite button for pending users', () => {
    renderWithProviders(<SuperUsersPage />)
    expect(screen.getByRole('button', { name: /resend invite.*priya sharma/i })).toBeTruthy()
  })

  it('calls reinvite mutation when resend invite is clicked', () => {
    renderWithProviders(<SuperUsersPage />)
    fireEvent.click(screen.getByRole('button', { name: /resend invite.*priya sharma/i }))
    expect(mockReinviteMutate).toHaveBeenCalledWith('user-3', expect.any(Object))
  })
})
