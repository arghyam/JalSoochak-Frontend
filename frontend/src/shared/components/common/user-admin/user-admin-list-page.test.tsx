import { useState } from 'react'
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
  {
    id: 'u-3',
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
    resendInvite: 'Resend invite',
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

  it('calls onRefetch when Retry button is clicked', () => {
    const onRefetchMock = jest.fn()
    renderWithProviders(
      <UserAdminListPage
        data={[]}
        isLoading={false}
        isError={true}
        onRefetch={onRefetchMock}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRefetchMock).toHaveBeenCalled()
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
    const Harness = () => {
      const [q, setQ] = useState('')
      const filtered = mockData.filter((row) => {
        const hay = `${row.firstName} ${row.lastName} ${row.email} ${row.phone}`.toLowerCase()
        return hay.includes(q.trim().toLowerCase())
      })
      return (
        <UserAdminListPage
          data={filtered}
          isLoading={false}
          isError={false}
          onRefetch={jest.fn()}
          routes={mockRoutes}
          labels={mockLabels}
          searchQuery={q}
          onSearchChange={setQ}
        />
      )
    }
    renderWithProviders(<Harness />)
    const searchInput = screen.getByRole('textbox', { name: /search users/i })
    fireEvent.change(searchInput, { target: { value: 'Ravi' } })
    expect(screen.getByText('Ravi Kumar')).toBeTruthy()
    expect(screen.queryByText('Sanjeev Kumar')).toBeNull()
  })

  it('shows empty message when no results match', () => {
    const Harness = () => {
      const [q, setQ] = useState('')
      const filtered = mockData.filter((row) => {
        const hay = `${row.firstName} ${row.lastName} ${row.email} ${row.phone}`.toLowerCase()
        return hay.includes(q.trim().toLowerCase())
      })
      return (
        <UserAdminListPage
          data={filtered}
          isLoading={false}
          isError={false}
          onRefetch={jest.fn()}
          routes={mockRoutes}
          labels={mockLabels}
          searchQuery={q}
          onSearchChange={setQ}
        />
      )
    }
    renderWithProviders(<Harness />)
    const searchInput = screen.getByRole('textbox', { name: /search users/i })
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

  it('renders resend invite button only for pending rows', () => {
    renderWithProviders(
      <UserAdminListPage
        data={mockData}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
        onReinvite={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /resend invite priya sharma/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /resend invite ravi kumar/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /resend invite sanjeev kumar/i })).toBeNull()
  })

  it('calls onReinvite with the correct id when resend invite is clicked', () => {
    const onReinviteMock = jest.fn()
    renderWithProviders(
      <UserAdminListPage
        data={mockData}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
        onReinvite={onReinviteMock}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /resend invite priya sharma/i }))
    expect(onReinviteMock).toHaveBeenCalledWith('u-3')
  })

  it('does not render resend invite button when onReinvite is not provided', () => {
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
    expect(screen.queryByRole('button', { name: /resend invite/i })).toBeNull()
  })

  it('renders Pending status chip for pending rows', () => {
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
    expect(screen.getByText('Pending')).toBeTruthy()
  })
})
