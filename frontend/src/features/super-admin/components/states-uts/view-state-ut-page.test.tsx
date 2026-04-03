import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { ViewStateUTPage } from './view-state-ut-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { UserAdminData } from '@/shared/components/common'
import type { InviteUserRequest } from '../../types/super-users'

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

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ tenantCode: 'MH' }),
}))

const mockUseStatesUTsQuery = jest.fn()
const mockUseStateAdminsByTenantQuery = jest.fn()
const mockInviteUserMutateAsync = jest.fn<(payload: InviteUserRequest) => Promise<void>>()
const mockInviteUserIsPending = { isPending: false }

jest.mock('../../services/query/use-super-admin-queries', () => ({
  useStatesUTsQuery: () => mockUseStatesUTsQuery(),
  useStateAdminsByTenantQuery: () => mockUseStateAdminsByTenantQuery(),
  useInviteUserMutation: () => ({
    mutateAsync: mockInviteUserMutateAsync,
    ...mockInviteUserIsPending,
  }),
}))

describe('ViewStateUTPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockInviteUserMutateAsync.mockReset()
    mockUseStatesUTsQuery.mockReturnValue({ data: [mockTenant], isLoading: false })
    mockUseStateAdminsByTenantQuery.mockReturnValue({ data: [mockAdmin], isLoading: false })
  })

  it('renders loading state when tenantsQuery.isLoading', () => {
    mockUseStatesUTsQuery.mockReturnValue({ data: undefined, isLoading: true })
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('renders not found text when tenant is not in list', () => {
    mockUseStatesUTsQuery.mockReturnValue({ data: [], isLoading: false })
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText(/not found/i)).toBeTruthy()
  })

  it('renders tenant name', () => {
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText('Maharashtra')).toBeTruthy()
  })

  it('renders stateCode', () => {
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText('MH')).toBeTruthy()
  })

  it('renders lgdCode', () => {
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText('27')).toBeTruthy()
  })

  it('renders ACTIVE status chip', () => {
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText(/active/i)).toBeTruthy()
  })

  it('renders SUSPENDED status chip for suspended tenant', () => {
    mockUseStatesUTsQuery.mockReturnValue({
      data: [{ ...mockTenant, status: 'SUSPENDED' }],
      isLoading: false,
    })
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText(/suspended/i)).toBeTruthy()
  })

  it('renders admin firstName and email', () => {
    renderWithProviders(<ViewStateUTPage />)
    expect(screen.getByText('Raj')).toBeTruthy()
    expect(screen.getByText('raj@example.com')).toBeTruthy()
  })

  it('edit icon button navigates to edit route on click', () => {
    renderWithProviders(<ViewStateUTPage />)
    const editBtn = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/super-user/states-uts/MH/edit')
  })

  describe('when no admins assigned', () => {
    beforeEach(() => {
      mockUseStateAdminsByTenantQuery.mockReturnValue({ data: [], isLoading: false })
    })

    it('shows no-admin description instead of N/A', () => {
      renderWithProviders(<ViewStateUTPage />)
      expect(screen.getByText(/no state admin has been assigned to this state\/ut/i)).toBeTruthy()
    })

    it('renders the invite form with all required fields', () => {
      renderWithProviders(<ViewStateUTPage />)
      expect(screen.getByText(/first name/i)).toBeTruthy()
      expect(screen.getByText(/last name/i)).toBeTruthy()
      expect(screen.getByText(/phone number/i)).toBeTruthy()
      expect(screen.getByText(/email address/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /send invite via email/i })).toBeTruthy()
    })

    it('does not show N/A text', () => {
      renderWithProviders(<ViewStateUTPage />)
      expect(screen.queryByText('N/A')).toBeNull()
    })

    it('calls inviteUser mutation with correct payload on valid submit', async () => {
      mockInviteUserMutateAsync.mockResolvedValue(undefined)
      renderWithProviders(<ViewStateUTPage />)

      const allInputs = document.querySelectorAll('input')
      const textInputs = Array.from(allInputs).filter((i) => i.type === 'text')
      const phoneInput = Array.from(allInputs).find((i) => i.type === 'tel')
      const emailInput = Array.from(allInputs).find((i) => i.type === 'email')

      if (textInputs[0]) fireEvent.change(textInputs[0], { target: { value: 'Priya' } })
      if (textInputs[1]) fireEvent.change(textInputs[1], { target: { value: 'Singh' } })
      if (phoneInput) fireEvent.change(phoneInput, { target: { value: '9123456780' } })
      if (emailInput) fireEvent.change(emailInput, { target: { value: 'priya@example.com' } })

      fireEvent.click(screen.getByRole('button', { name: /send invite via email/i }))

      await waitFor(() => {
        expect(mockInviteUserMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'STATE_ADMIN',
            tenantCode: 'MH',
            email: 'priya@example.com',
          })
        )
      })
    })

    it('does not call inviteUser when form is invalid', async () => {
      renderWithProviders(<ViewStateUTPage />)
      fireEvent.click(screen.getByRole('button', { name: /send invite via email/i }))
      await waitFor(() => {
        expect(mockInviteUserMutateAsync).not.toHaveBeenCalled()
      })
    })

    it('keeps invite form visible after failed invite', async () => {
      mockInviteUserMutateAsync.mockRejectedValue(new Error('invite error'))
      renderWithProviders(<ViewStateUTPage />)

      const allInputs = document.querySelectorAll('input')
      const textInputs = Array.from(allInputs).filter((i) => i.type === 'text')
      const phoneInput = Array.from(allInputs).find((i) => i.type === 'tel')
      const emailInput = Array.from(allInputs).find((i) => i.type === 'email')

      if (textInputs[0]) fireEvent.change(textInputs[0], { target: { value: 'Priya' } })
      if (textInputs[1]) fireEvent.change(textInputs[1], { target: { value: 'Singh' } })
      if (phoneInput) fireEvent.change(phoneInput, { target: { value: '9123456780' } })
      if (emailInput) fireEvent.change(emailInput, { target: { value: 'priya@example.com' } })

      fireEvent.click(screen.getByRole('button', { name: /send invite via email/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send invite via email/i })).toBeTruthy()
      })
    })
  })
})
