import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { InviteStateUTAdminPage } from './invite-state-ut-admin-page'
import { renderWithProviders } from '@/test/render-with-providers'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockMutateAsync = jest.fn<(input: { email: string; tenantCode: string }) => Promise<void>>()
const mockUseInviteStateUTAdminMutation = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useInviteStateUTAdminMutation: () => mockUseInviteStateUTAdminMutation(),
}))

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: (selector: (s: { user: { tenantCode: string } }) => unknown) =>
    selector({ user: { tenantCode: 'MH' } }),
}))

describe('InviteStateUTAdminPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockMutateAsync.mockReset()
    mockMutateAsync.mockResolvedValue(undefined)
    mockUseInviteStateUTAdminMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    })
  })

  it('renders heading "Add State/UT Admin"', () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    expect(screen.getByRole('heading', { name: /add state\/ut admin/i })).toBeTruthy()
  })

  it('renders email input', () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    expect(screen.getByLabelText(/email address/i)).toBeTruthy()
  })

  it('submit button is disabled when email is empty', () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    const submitBtn = screen.getByRole('button', {
      name: /add state\/ut admin & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('submit button is disabled when email is invalid', () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'not-an-email' },
    })
    const submitBtn = screen.getByRole('button', {
      name: /add state\/ut admin & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('submit button is enabled when valid email is entered', () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    })
    const submitBtn = screen.getByRole('button', {
      name: /add state\/ut admin & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('Cancel navigates to /state-admin/state-ut-admins', () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/state-admin/state-ut-admins')
  })

  it('calls mutateAsync with email and tenantCode on submit', async () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /add state\/ut admin & send link via email/i })
    )
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: 'test@example.com',
        tenantCode: 'MH',
      })
    })
  })

  it('shows error toast when mutateAsync rejects', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Server error'))
    renderWithProviders(<InviteStateUTAdminPage />)
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /add state\/ut admin & send link via email/i })
    )
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy()
    })
  })
})
