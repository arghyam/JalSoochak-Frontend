import { screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { UserAdminFormPage } from './user-admin-form-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type {
  UserAdminData,
  UserAdminRoutes,
  UserAdminFormPageLabels,
  UserAdminCreateMutation,
  UserAdminUpdateMutation,
  UserAdminStatusMutation,
} from './types'
import type { UserAdminFormConfig, UserAdminFormActions } from './user-admin-form-page'

const mockAdmin: UserAdminData = {
  id: 'u-1',
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
}))

const mockRoutes: UserAdminRoutes = {
  list: '/test/users',
  add: '/test/users/add',
  view: (id) => `/test/users/${id}`,
  edit: (id) => `/test/users/${id}/edit`,
}

const mockLabels: UserAdminFormPageLabels = {
  addTitle: 'Add Test User',
  editTitle: 'Edit Test User',
  breadcrumb: {
    manage: 'Manage Test Users',
    addNew: 'Add Test User',
    edit: 'Edit Test User',
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
    itemAdded: 'User added successfully',
    failedToAdd: 'Failed to add user',
    activatedSuccess: 'User activated',
    deactivatedSuccess: 'User deactivated',
    failedToUpdateStatus: 'Failed to update status',
  },
  buttons: {
    addAndSendLink: 'Add Test User & Send Link via Email',
  },
}

function makeCreateMutation(
  overrides: Partial<UserAdminCreateMutation> = {}
): UserAdminCreateMutation {
  return {
    mutateAsync: jest.fn<() => Promise<UserAdminData>>().mockResolvedValue(mockAdmin),
    isPending: false,
    ...overrides,
  }
}

function makeUpdateMutation(
  overrides: Partial<UserAdminUpdateMutation> = {}
): UserAdminUpdateMutation {
  return {
    mutateAsync: jest.fn<() => Promise<unknown>>().mockResolvedValue(mockAdmin),
    isPending: false,
    ...overrides,
  }
}

function makeStatusMutation(
  overrides: Partial<UserAdminStatusMutation> = {}
): UserAdminStatusMutation {
  return {
    mutateAsync: jest.fn<() => Promise<unknown>>().mockResolvedValue(mockAdmin),
    isPending: false,
    ...overrides,
  }
}

function makeConfig(overrides: Partial<UserAdminFormConfig> = {}): UserAdminFormConfig {
  return {
    isEditMode: false,
    original: null,
    isLoadingOriginal: false,
    ...overrides,
  }
}

function makeActions(overrides: Partial<UserAdminFormActions> = {}): UserAdminFormActions {
  return {
    createMutation: makeCreateMutation(),
    updateMutation: makeUpdateMutation(),
    statusMutation: makeStatusMutation(),
    ...overrides,
  }
}

describe('UserAdminFormPage — Add Mode', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('renders add title', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig()}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByRole('heading', { name: /add test user/i })).toBeTruthy()
  })

  it('renders all four required fields', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig()}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByLabelText(/first name/i)).toBeTruthy()
    expect(screen.getByLabelText(/last name/i)).toBeTruthy()
    expect(screen.getByLabelText(/email address/i)).toBeTruthy()
    expect(screen.getByLabelText(/phone number/i)).toBeTruthy()
  })

  it('renders all fields in create mode with empty defaults', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig({ isEditMode: false, original: null })}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect((screen.getByLabelText(/first name/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/last name/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/email address/i) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/phone number/i) as HTMLInputElement).value).toBe('')
  })

  it('submit button is disabled when form is empty', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig()}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    const submitBtn = screen.getByRole('button', {
      name: /add test user & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('submit button is enabled when form is valid', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig()}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Vijay' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Kumar' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'vijay@gmail.com' },
    })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '8564254517' } })
    const submitBtn = screen.getByRole('button', {
      name: /add test user & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('shows required field validation errors after submit attempt with empty form', async () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig()}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    await act(async () => {
      const form = document.querySelector('form') as HTMLFormElement
      fireEvent.submit(form)
    })
    // At least one "This field is required" error must appear
    const errorMessages = screen.getAllByText('This field is required')
    expect(errorMessages.length).toBeGreaterThan(0)
  })

  it('does not show status toggle in add mode', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig()}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.queryByText('Activated')).toBeNull()
  })

  it('navigates to list on Cancel click', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig()}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/test/users')
  })

  it('calls createMutation.mutateAsync with form data on submit', async () => {
    const createMutation = makeCreateMutation()
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig()}
        actions={makeActions({ createMutation })}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Vijay' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Kumar' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'vijay@gmail.com' },
    })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '8564254517' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add test user & send link via email/i }))
    })
    expect(createMutation.mutateAsync).toHaveBeenCalledWith({
      firstName: 'Vijay',
      lastName: 'Kumar',
      email: 'vijay@gmail.com',
      phone: '8564254517',
    })
  })
})

describe('UserAdminFormPage — Edit Mode', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('renders edit title', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig({ id: 'u-1', isEditMode: true, original: mockAdmin })}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByRole('heading', { name: /edit test user/i })).toBeTruthy()
  })

  it('renders loading state when isLoadingOriginal is true', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig({
          id: 'u-1',
          isEditMode: true,
          original: null,
          isLoadingOriginal: true,
        })}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders not found when original is null and not loading', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig({ id: 'u-1', isEditMode: true, original: null })}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByText('User not found')).toBeTruthy()
  })

  it('email input has disabled attribute in edit mode', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig({ id: 'u-1', isEditMode: true, original: mockAdmin })}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
    expect(emailInput.disabled).toBe(true)
  })

  it('email field is read-only in edit mode', async () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig({ id: 'u-1', isEditMode: true, original: mockAdmin })}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
    await userEvent.type(emailInput, 'new@example.com')
    expect(emailInput.value).toBe(mockAdmin.email)
  })

  it('shows status toggle in edit mode', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig({ id: 'u-1', isEditMode: true, original: mockAdmin })}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByText('Activated')).toBeTruthy()
  })

  it('shows Save Changes button in edit mode', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig({ id: 'u-1', isEditMode: true, original: mockAdmin })}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    expect(screen.getByRole('button', { name: /save changes/i })).toBeTruthy()
  })

  it('navigates to view page on Cancel click in edit mode', () => {
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig({ id: 'u-1', isEditMode: true, original: mockAdmin })}
        actions={makeActions()}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/test/users/u-1')
  })

  it('calls updateMutation.mutateAsync with changed fields on Save Changes click', async () => {
    const updateMutation = makeUpdateMutation()
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig({ id: 'u-1', isEditMode: true, original: mockAdmin })}
        actions={makeActions({ updateMutation })}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Updated' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    })
    expect(updateMutation.mutateAsync).toHaveBeenCalledWith({
      id: 'u-1',
      input: { firstName: 'Updated', lastName: 'Kumar', phone: '8564254517' },
    })
  })

  it('navigates to view page with success toast state after successful update', async () => {
    const updateMutation = makeUpdateMutation()
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig({ id: 'u-1', isEditMode: true, original: mockAdmin })}
        actions={makeActions({ updateMutation })}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Updated' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    })
    expect(mockNavigate).toHaveBeenCalledWith('/test/users/u-1', {
      state: { successToast: 'Changes saved successfully' },
    })
  })

  it('calls statusMutation.mutateAsync with new status when toggle is clicked', async () => {
    const statusMutation = makeStatusMutation()
    renderWithProviders(
      <UserAdminFormPage
        config={makeConfig({ id: 'u-1', isEditMode: true, original: mockAdmin })}
        actions={makeActions({ statusMutation })}
        routes={mockRoutes}
        labels={mockLabels}
      />
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox'))
    })
    expect(statusMutation.mutateAsync).toHaveBeenCalledWith({ id: 'u-1', status: 'inactive' })
  })
})
