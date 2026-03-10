import { screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { UserAdminListPage } from './user-admin-list-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { UserAdminData, UserAdminRoutes, UserAdminListLabels } from './types'

const mockData: UserAdminData[] = [
  {
    id: 'u-1',
    firstName: 'Ravi',
    lastName: 'Kumar',
    email: 'ravi@gmail.com',
    phone: '9845285564',
    status: 'active',
  },
  {
    id: 'u-2',
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

const mockRoutes: UserAdminRoutes = {
  list: '/test/users',
  add: '/test/users/add',
  view: (id) => `/test/users/${id}`,
  edit: (id) => `/test/users/${id}/edit`,
}

const mockLabels: UserAdminListLabels = {
  pageTitle: 'Test Users',
  addButton: 'Add Test User',
  allStatuses: 'All Statuses',
  noItemsFound: 'No users found',
  table: {
    name: 'Name',
    mobileNumber: 'Mobile Number',
    emailAddress: 'Email Address',
    status: 'Status',
    actions: 'Actions',
  },
  aria: {
    search: 'Search users',
    view: 'View',
    edit: 'Edit',
  },
}

describe('UserAdminListPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('renders the page title', () => {
    renderWithProviders(
      <UserAdminListPage
        data={mockData}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByRole('heading', { name: /test users/i })).toBeTruthy()
  })

  it('renders loading state', () => {
    renderWithProviders(
      <UserAdminListPage
        data={[]}
        isLoading={true}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders error state with retry button', () => {
    renderWithProviders(
      <UserAdminListPage
        data={[]}
        isLoading={false}
        isError={true}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })

  it('renders all data rows', () => {
    renderWithProviders(
      <UserAdminListPage
        data={mockData}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByText('Ravi Kumar')).toBeTruthy()
    expect(screen.getByText('Sanjeev Kumar')).toBeTruthy()
    expect(screen.getByText('ravi@gmail.com')).toBeTruthy()
    expect(screen.getByText('sanjeev@gmail.com')).toBeTruthy()
  })

  it('renders table column headers from labels', () => {
    renderWithProviders(
      <UserAdminListPage
        data={mockData}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByText('Name')).toBeTruthy()
    expect(screen.getByText('Mobile Number')).toBeTruthy()
    expect(screen.getByText('Email Address')).toBeTruthy()
    expect(screen.getByText('Status')).toBeTruthy()
    expect(screen.getByText('Actions')).toBeTruthy()
  })

  it('formats phone numbers with +91 prefix and dash', () => {
    renderWithProviders(
      <UserAdminListPage
        data={mockData}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByText('+91 98452-85564')).toBeTruthy()
  })

  it('filters items by search query', () => {
    renderWithProviders(
      <UserAdminListPage
        data={mockData}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    const searchInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(searchInput, { target: { value: 'Ravi' } })
    expect(screen.getByText('Ravi Kumar')).toBeTruthy()
    expect(screen.queryByText('Sanjeev Kumar')).toBeNull()
  })

  it('shows empty message when no results match', () => {
    renderWithProviders(
      <UserAdminListPage
        data={mockData}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    const searchInput = screen.getAllByRole('textbox')[0]
    fireEvent.change(searchInput, { target: { value: 'zzznomatch' } })
    expect(screen.getByText('No users found')).toBeTruthy()
  })

  it('navigates to add route when add button is clicked', () => {
    renderWithProviders(
      <UserAdminListPage
        data={mockData}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /add test user/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/test/users/add')
  })

  it('navigates to view route when view icon is clicked', () => {
    renderWithProviders(
      <UserAdminListPage
        data={mockData}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    const viewButtons = screen.getAllByRole('button', { name: /view ravi kumar/i })
    fireEvent.click(viewButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/test/users/u-1')
  })

  it('navigates to edit route when edit icon is clicked', () => {
    renderWithProviders(
      <UserAdminListPage
        data={mockData}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    const editButtons = screen.getAllByRole('button', { name: /edit ravi kumar/i })
    fireEvent.click(editButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/test/users/u-1/edit')
  })
})
