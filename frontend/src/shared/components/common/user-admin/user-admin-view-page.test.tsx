import { screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { UserAdminViewPage } from './user-admin-view-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { UserAdminData, UserAdminRoutes, UserAdminViewLabels } from './types'

const mockAdmin: UserAdminData = {
  id: 'u-1',
  firstName: 'Vijay',
  lastName: 'Kumar',
  email: 'vijay.kumar@gmail.com',
  phone: '8564254517',
  status: 'active',
}

const mockNavigate = jest.fn()
const mockLocationState: { successToast?: string } = {}

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/test/users/u-1', state: mockLocationState }),
}))

const mockRoutes: UserAdminRoutes = {
  list: '/test/users',
  add: '/test/users/add',
  view: (id) => `/test/users/${id}`,
  edit: (id) => `/test/users/${id}/edit`,
}

const mockLabels: UserAdminViewLabels = {
  pageTitle: 'Test Users',
  viewTitle: 'View Test User',
  breadcrumb: {
    manage: 'Manage Test Users',
    view: 'View Test User',
  },
  form: {
    userDetails: 'User Details',
    firstName: 'First name',
    lastName: 'Last name',
    emailAddress: 'Email address',
    phoneNumber: 'Phone number',
    statusSection: 'Status',
    activated: 'Activated',
  },
  messages: {
    notFound: 'User not found',
  },
  aria: {
    edit: 'Edit',
  },
}

describe('UserAdminViewPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    delete mockLocationState.successToast
  })

  it('renders page title', () => {
    renderWithProviders(
      <UserAdminViewPage
        id="u-1"
        data={mockAdmin}
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
      <UserAdminViewPage
        id="u-1"
        data={null}
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
    const mockRefetch = jest.fn()
    renderWithProviders(
      <UserAdminViewPage
        id="u-1"
        data={null}
        isLoading={false}
        isError={true}
        error={new Error('Failed to fetch user')}
        onRefetch={mockRefetch}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByText('Failed to fetch user')).toBeTruthy()
    expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy()
  })

  it('calls onRefetch when retry is clicked', () => {
    const mockRefetch = jest.fn()
    renderWithProviders(
      <UserAdminViewPage
        id="u-1"
        data={null}
        isLoading={false}
        isError={true}
        error={new Error('Network error')}
        onRefetch={mockRefetch}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('renders User Details section', () => {
    renderWithProviders(
      <UserAdminViewPage
        id="u-1"
        data={mockAdmin}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByText('User Details')).toBeTruthy()
  })

  it('displays all user fields', () => {
    renderWithProviders(
      <UserAdminViewPage
        id="u-1"
        data={mockAdmin}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByText('Vijay')).toBeTruthy()
    expect(screen.getByText('Kumar')).toBeTruthy()
    expect(screen.getByText('vijay.kumar@gmail.com')).toBeTruthy()
    expect(screen.getByText('+91 85642-54517')).toBeTruthy()
  })

  it('displays active status chip', () => {
    renderWithProviders(
      <UserAdminViewPage
        id="u-1"
        data={mockAdmin}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('displays inactive status chip for inactive user', () => {
    renderWithProviders(
      <UserAdminViewPage
        id="u-1"
        data={{ ...mockAdmin, status: 'inactive' }}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByText('Inactive')).toBeTruthy()
  })

  it('renders breadcrumb with manage and view labels', () => {
    renderWithProviders(
      <UserAdminViewPage
        id="u-1"
        data={mockAdmin}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByText('Manage Test Users')).toBeTruthy()
    expect(screen.getByText('View Test User')).toBeTruthy()
  })

  it('navigates to list when breadcrumb manage link is clicked', () => {
    renderWithProviders(
      <UserAdminViewPage
        id="u-1"
        data={mockAdmin}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    fireEvent.click(screen.getByText('Manage Test Users'))
    expect(mockNavigate).toHaveBeenCalledWith('/test/users')
  })

  it('navigates to edit page when edit icon is clicked', () => {
    renderWithProviders(
      <UserAdminViewPage
        id="u-1"
        data={mockAdmin}
        isLoading={false}
        isError={false}
        onRefetch={jest.fn()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    const editButton = screen.getByRole('button', { name: /edit vijay kumar/i })
    fireEvent.click(editButton)
    expect(mockNavigate).toHaveBeenCalledWith('/test/users/u-1/edit')
  })

  it('shows success toast when location state contains successToast', async () => {
    mockLocationState.successToast = 'Changes saved successfully'
    await act(async () => {
      renderWithProviders(
        <UserAdminViewPage
          id="u-1"
          data={mockAdmin}
          isLoading={false}
          isError={false}
          onRefetch={jest.fn()}
          routes={mockRoutes}
          labels={mockLabels}
        />
      )
    })
    expect(screen.getByText('Changes saved successfully')).toBeTruthy()
  })
})
