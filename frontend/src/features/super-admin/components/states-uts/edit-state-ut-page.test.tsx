import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { EditStateUTPage } from './edit-state-ut-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { UserAdminData } from '@/shared/components/common'

const mockTenant = {
  id: 1,
  uuid: 'uuid-1',
  stateCode: 'MH',
  lgdCode: 27,
  name: 'Maharashtra',
  status: 'ACTIVE' as const,
  createdAt: '2024-01-15T00:00:00.000Z',
}

const mockAdmin: UserAdminData = {
  id: 'admin-1',
  firstName: 'Raj',
  lastName: 'Sharma',
  email: 'raj@example.com',
  phone: '9876543210',
  status: 'active',
}

const mockPendingAdmin: UserAdminData = {
  ...mockAdmin,
  status: 'pending',
}

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ tenantCode: 'MH' }),
}))

const mockUseStatesUTsQuery = jest.fn()
const mockUseStateAdminsByTenantQuery = jest.fn()
const mockUseUpdateTenantStatusMutation = jest.fn()
const mockUseUpdateUserMutation = jest.fn()
const mockUseUpdateUserStatusMutation = jest.fn()

jest.mock('../../services/query/use-super-admin-queries', () => ({
  useStatesUTsQuery: () => mockUseStatesUTsQuery(),
  useStateAdminsByTenantQuery: () => mockUseStateAdminsByTenantQuery(),
  useUpdateTenantStatusMutation: () => mockUseUpdateTenantStatusMutation(),
  useUpdateUserMutation: () => mockUseUpdateUserMutation(),
  useUpdateUserStatusMutation: () => mockUseUpdateUserStatusMutation(),
}))

describe('EditStateUTPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseStatesUTsQuery.mockReturnValue({ data: [mockTenant], isLoading: false })
    mockUseStateAdminsByTenantQuery.mockReturnValue({ data: [mockAdmin], isLoading: false })
    mockUseUpdateTenantStatusMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      isPending: false,
    })
    mockUseUpdateUserMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      isPending: false,
    })
    mockUseUpdateUserStatusMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      isPending: false,
    })
  })

  it('renders loading state when tenantsQuery.isLoading', () => {
    mockUseStatesUTsQuery.mockReturnValue({ data: undefined, isLoading: true })
    renderWithProviders(<EditStateUTPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders not found text when tenant is not in list', () => {
    mockUseStatesUTsQuery.mockReturnValue({ data: [], isLoading: false })
    renderWithProviders(<EditStateUTPage />)
    expect(screen.getByText(/not found/i)).toBeTruthy()
  })

  it('renders tenant name as readonly input', () => {
    renderWithProviders(<EditStateUTPage />)
    const nameInput = screen.getByDisplayValue('Maharashtra') as HTMLInputElement
    expect(nameInput).toBeTruthy()
    expect(nameInput.readOnly || nameInput.disabled).toBe(true)
  })

  it('renders admin firstName as editable input', () => {
    renderWithProviders(<EditStateUTPage />)
    const firstNameInput = screen.getByDisplayValue('Raj') as HTMLInputElement
    expect(firstNameInput).toBeTruthy()
    expect(firstNameInput.readOnly || firstNameInput.disabled).toBe(false)
  })

  it('Save button is enabled after changing admin firstName', () => {
    renderWithProviders(<EditStateUTPage />)
    fireEvent.change(screen.getByDisplayValue('Raj'), { target: { value: 'Rahul' } })
    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    expect((saveBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('renders admin email as readonly input', () => {
    renderWithProviders(<EditStateUTPage />)
    const emailInput = screen.getByDisplayValue('raj@example.com') as HTMLInputElement
    expect(emailInput).toBeTruthy()
    expect(emailInput.readOnly || emailInput.disabled).toBe(true)
  })

  it('Save button is disabled when no changes made', () => {
    renderWithProviders(<EditStateUTPage />)
    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('Save button is enabled after changing admin lastName', () => {
    renderWithProviders(<EditStateUTPage />)
    const lastNameInput = screen.getByDisplayValue('Sharma')
    fireEvent.change(lastNameInput, { target: { value: 'Patil' } })
    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    expect((saveBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('Cancel navigates to view page', () => {
    renderWithProviders(<EditStateUTPage />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/super-user/states-uts/MH')
  })

  it('Save calls updateUserMutation for changed admin', async () => {
    const mockMutateAsync = jest
      .fn<
        (args: {
          id: string
          payload: { firstName: string; lastName: string; phoneNumber: string }
        }) => Promise<void>
      >()
      .mockResolvedValue(undefined)
    mockUseUpdateUserMutation.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false })

    renderWithProviders(<EditStateUTPage />)
    fireEvent.change(screen.getByDisplayValue('Sharma'), { target: { value: 'Patil' } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 'admin-1',
        payload: { firstName: 'Raj', lastName: 'Patil', phoneNumber: '9876543210' },
      })
    })
  })

  it('renders status combobox showing current tenant status label', () => {
    renderWithProviders(<EditStateUTPage />)
    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('status combobox is disabled while mutation is pending', () => {
    mockUseUpdateTenantStatusMutation.mockReturnValue({
      mutateAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      isPending: true,
    })
    renderWithProviders(<EditStateUTPage />)
    const combobox = screen.getByRole('combobox') as HTMLButtonElement
    expect(combobox.disabled).toBe(true)
  })

  it('selecting a status option calls updateStatusMutation with new status', async () => {
    const mockStatusMutateAsync = jest
      .fn<(args: { id: number; status: string }) => Promise<void>>()
      .mockResolvedValue(undefined)
    mockUseUpdateTenantStatusMutation.mockReturnValue({
      mutateAsync: mockStatusMutateAsync,
      isPending: false,
    })

    renderWithProviders(<EditStateUTPage />)
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByRole('option', { name: 'Suspended' }))

    await waitFor(() => {
      expect(mockStatusMutateAsync).toHaveBeenCalledWith({ id: 1, status: 'SUSPENDED' })
    })
  })

  it('disables admin toggle when status is pending', () => {
    mockUseStateAdminsByTenantQuery.mockReturnValue({ data: [mockPendingAdmin], isLoading: false })
    renderWithProviders(<EditStateUTPage />)

    const toggle = screen.getByRole('checkbox', { name: /activated raj/i }) as HTMLInputElement
    expect(toggle.disabled).toBe(true)
  })
})
