import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { AddStateUTPage } from './add-state-ut-page'
import { renderWithProviders } from '@/test/render-with-providers'
import { ROUTES } from '@/shared/constants/routes'
import type { Tenant } from '../../types/states-uts'
import type { InviteUserRequest } from '../../types/super-users'

const mockTenant: Tenant = {
  id: 1,
  uuid: 'uuid-1',
  stateCode: 'MH',
  lgdCode: 27,
  name: 'Maharashtra',
  status: 'ONBOARDED',
  createdAt: '2024-01-15T00:00:00.000Z',
}

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockUseStatesUTsQuery = jest.fn()
const mockCreateTenantMutateAsync =
  jest.fn<(payload: { stateCode: string; name: string; lgdCode: number }) => Promise<Tenant>>()
const mockInviteUserMutateAsync = jest.fn<(payload: InviteUserRequest) => Promise<void>>()

jest.mock('../../services/query/use-super-admin-queries', () => ({
  useStatesUTsQuery: () => mockUseStatesUTsQuery(),
  useCreateTenantMutation: () => ({
    mutateAsync: mockCreateTenantMutateAsync,
    isPending: false,
  }),
  useInviteUserMutation: () => ({
    mutateAsync: mockInviteUserMutateAsync,
    isPending: false,
  }),
}))

describe('AddStateUTPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockCreateTenantMutateAsync.mockReset()
    mockInviteUserMutateAsync.mockReset()
    mockUseStatesUTsQuery.mockReturnValue({ data: [], isLoading: false })
  })

  describe('Step 1 — Tenant creation', () => {
    it('renders step 1 of 2 indicator', () => {
      renderWithProviders(<AddStateUTPage />)
      expect(screen.getByText(/step 1 of 2/i)).toBeTruthy()
    })

    it('renders the State/UT Details heading', () => {
      renderWithProviders(<AddStateUTPage />)
      expect(screen.getByText(/state\/ut details/i)).toBeTruthy()
    })

    it('renders Create State/UT and Cancel buttons', () => {
      renderWithProviders(<AddStateUTPage />)
      expect(screen.getByRole('button', { name: /create state\/ut/i })).toBeTruthy()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy()
    })

    it('Create State/UT button is disabled when no state selected', () => {
      renderWithProviders(<AddStateUTPage />)
      const btn = screen.getByRole('button', { name: /create state\/ut/i }) as HTMLButtonElement
      expect(btn.disabled).toBe(true)
    })

    it('Cancel button navigates to list', () => {
      renderWithProviders(<AddStateUTPage />)
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/super-user/states-uts')
    })

    it('calls createTenant mutation and transitions to step 2 on success', async () => {
      mockCreateTenantMutateAsync.mockResolvedValue(mockTenant)
      renderWithProviders(<AddStateUTPage />)

      const select = screen.getByRole('combobox')
      fireEvent.mouseDown(select)
      const option = await screen.findByText('Maharashtra')
      fireEvent.click(option)

      fireEvent.click(screen.getByRole('button', { name: /create state\/ut/i }))

      await waitFor(() => {
        expect(mockCreateTenantMutateAsync).toHaveBeenCalledWith({
          stateCode: 'MH',
          name: 'Maharashtra',
          lgdCode: expect.any(Number),
        })
      })

      await waitFor(() => {
        expect(screen.getByText(/step 2 of 2/i)).toBeTruthy()
      })
    })

    it('shows error toast and stays on step 1 when createTenant fails', async () => {
      mockCreateTenantMutateAsync.mockRejectedValue(new Error('API error'))
      renderWithProviders(<AddStateUTPage />)

      const select = screen.getByRole('combobox')
      fireEvent.mouseDown(select)
      const option = await screen.findByText('Maharashtra')
      fireEvent.click(option)

      fireEvent.click(screen.getByRole('button', { name: /create state\/ut/i }))

      await waitFor(() => {
        expect(screen.getByText(/step 1 of 2/i)).toBeTruthy()
      })
    })
  })

  describe('Step 2 — Admin invite', () => {
    beforeEach(async () => {
      mockCreateTenantMutateAsync.mockResolvedValue(mockTenant)
      renderWithProviders(<AddStateUTPage />)

      const select = screen.getByRole('combobox')
      fireEvent.mouseDown(select)
      const option = await screen.findByText('Maharashtra')
      fireEvent.click(option)

      fireEvent.click(screen.getByRole('button', { name: /create state\/ut/i }))
      await screen.findByText(/step 2 of 2/i)
    })

    it('renders step 2 of 2 indicator', () => {
      expect(screen.getByText(/step 2 of 2/i)).toBeTruthy()
    })

    it('renders read-only tenant details', () => {
      expect(screen.getByText('Maharashtra')).toBeTruthy()
      expect(screen.getByText('MH')).toBeTruthy()
    })

    it('renders Send Invite and Skip for Now buttons', () => {
      expect(screen.getByRole('button', { name: /send invite via email/i })).toBeTruthy()
      expect(screen.getByRole('button', { name: /skip for now/i })).toBeTruthy()
    })

    it('Skip for Now navigates to view page without calling invite', () => {
      fireEvent.click(screen.getByRole('button', { name: /skip for now/i }))
      expect(mockNavigate).toHaveBeenCalledWith(
        ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':tenantCode', 'MH')
      )
      expect(mockInviteUserMutateAsync).not.toHaveBeenCalled()
    })

    it('does not call inviteUser when form fields are empty', async () => {
      fireEvent.click(screen.getByRole('button', { name: /send invite via email/i }))
      await waitFor(() => {
        expect(mockInviteUserMutateAsync).not.toHaveBeenCalled()
      })
    })

    it('calls inviteUser mutation with correct payload and navigates on success', async () => {
      mockInviteUserMutateAsync.mockResolvedValue(undefined)

      const allInputs = document.querySelectorAll('input')
      const textInputs = Array.from(allInputs).filter((i) => i.type === 'text')
      const phoneInput = Array.from(allInputs).find((i) => i.type === 'tel')
      const emailInput = Array.from(allInputs).find((i) => i.type === 'email')

      if (textInputs[0]) fireEvent.change(textInputs[0], { target: { value: 'Raj' } })
      if (textInputs[1]) fireEvent.change(textInputs[1], { target: { value: 'Sharma' } })
      if (phoneInput) fireEvent.change(phoneInput, { target: { value: '9876543210' } })
      if (emailInput) fireEvent.change(emailInput, { target: { value: 'raj@example.com' } })

      fireEvent.click(screen.getByRole('button', { name: /send invite via email/i }))

      await waitFor(() => {
        expect(mockInviteUserMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'STATE_ADMIN',
            tenantCode: 'MH',
            email: 'raj@example.com',
          })
        )
      })
    })

    it('stays on step 2 when invite fails', async () => {
      mockInviteUserMutateAsync.mockRejectedValue(new Error('invite error'))

      const allInputs = document.querySelectorAll('input')
      const textInputs = Array.from(allInputs).filter((i) => i.type === 'text')
      const phoneInput = Array.from(allInputs).find((i) => i.type === 'tel')
      const emailInput = Array.from(allInputs).find((i) => i.type === 'email')

      if (textInputs[0]) fireEvent.change(textInputs[0], { target: { value: 'Raj' } })
      if (textInputs[1]) fireEvent.change(textInputs[1], { target: { value: 'Sharma' } })
      if (phoneInput) fireEvent.change(phoneInput, { target: { value: '9876543210' } })
      if (emailInput) fireEvent.change(emailInput, { target: { value: 'raj@example.com' } })

      fireEvent.click(screen.getByRole('button', { name: /send invite via email/i }))

      await waitFor(() => {
        expect(screen.getByText(/step 2 of 2/i)).toBeTruthy()
      })
    })
  })
})
