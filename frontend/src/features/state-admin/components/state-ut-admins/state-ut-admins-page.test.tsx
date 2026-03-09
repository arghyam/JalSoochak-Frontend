import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { StateUTAdminsPage } from './state-ut-admins-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { StateUTAdmin } from '../../types/state-ut-admins'

const mockAdmins: StateUTAdmin[] = [
  {
    id: 'admin-1',
    firstName: 'Ravi',
    lastName: 'Kumar',
    email: 'ravi@gmail.com',
    phone: '9845285564',
    status: 'active',
  },
  {
    id: 'admin-2',
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

const mockUseStateUTAdminsQuery = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useStateUTAdminsQuery: () => mockUseStateUTAdminsQuery(),
}))

describe('StateUTAdminsPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseStateUTAdminsQuery.mockReturnValue({
      data: mockAdmins,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
  })

  it('renders the page title', () => {
    renderWithProviders(<StateUTAdminsPage />)
    expect(screen.getByRole('heading', { name: /state\/ut admins/i })).toBeTruthy()
  })

  it('renders loading state', () => {
    mockUseStateUTAdminsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    })
    renderWithProviders(<StateUTAdminsPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders error state with retry button', () => {
    mockUseStateUTAdminsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    })
    renderWithProviders(<StateUTAdminsPage />)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })

  it('renders all admin rows', () => {
    renderWithProviders(<StateUTAdminsPage />)
    expect(screen.getByText('Ravi Kumar')).toBeTruthy()
    expect(screen.getByText('Sanjeev Kumar')).toBeTruthy()
    expect(screen.getByText('ravi@gmail.com')).toBeTruthy()
    expect(screen.getByText('sanjeev@gmail.com')).toBeTruthy()
  })

  it('renders table column headers', () => {
    renderWithProviders(<StateUTAdminsPage />)
    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.getByText('Mobile Number')).toBeTruthy()
    expect(screen.getByText('Email Address')).toBeTruthy()
    expect(screen.getByText('Status')).toBeTruthy()
    expect(screen.getByText('Actions')).toBeTruthy()
  })

  it('formats phone numbers with +91 prefix and dash', () => {
    renderWithProviders(<StateUTAdminsPage />)
    expect(screen.getByText('+91 98452-85564')).toBeTruthy()
  })

  it('filters admins by name search', () => {
    renderWithProviders(<StateUTAdminsPage />)
    const searchInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(searchInput, { target: { value: 'Ravi' } })
    expect(screen.getByText('Ravi Kumar')).toBeTruthy()
    expect(screen.queryByText('Sanjeev Kumar')).toBeNull()
  })

  it('shows empty message when no results match search', () => {
    renderWithProviders(<StateUTAdminsPage />)
    const searchInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(searchInput, { target: { value: 'zzznomatch' } })
    expect(screen.getByText('No admins found')).toBeTruthy()
  })

  it('navigates to add page when Add State Admin button is clicked', () => {
    renderWithProviders(<StateUTAdminsPage />)
    fireEvent.click(screen.getByRole('button', { name: /add state\/ut admin/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/state-admin/state-ut-admins/add')
  })

  it('navigates to view page when view icon is clicked', () => {
    renderWithProviders(<StateUTAdminsPage />)
    const viewButtons = screen.getAllByRole('button', { name: /view admin/i })
    fireEvent.click(viewButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/state-admin/state-ut-admins/admin-1')
  })

  it('navigates to edit page when edit icon is clicked', () => {
    renderWithProviders(<StateUTAdminsPage />)
    const editButtons = screen.getAllByRole('button', { name: /edit admin/i })
    fireEvent.click(editButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/state-admin/state-ut-admins/admin-1/edit')
  })
})
