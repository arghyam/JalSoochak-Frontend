import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { InviteSuperUserPage } from './invite-super-user-page'
import { renderWithProviders } from '@/test/render-with-providers'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockUseInviteUserMutation = jest.fn()

jest.mock('../../services/query/use-super-admin-queries', () => ({
  useInviteUserMutation: () => mockUseInviteUserMutation(),
}))

function fillValidInviteForm() {
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Raj' } })
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Sharma' } })
  fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '9876543210' } })
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'valid@example.com' },
  })
}

describe('InviteSuperUserPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockUseInviteUserMutation.mockReturnValue({
      mutateAsync: jest.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
      isPending: false,
    })
  })

  it('renders heading "Add Super User"', () => {
    renderWithProviders(<InviteSuperUserPage />)
    expect(screen.getByRole('heading', { name: /add super user/i })).toBeTruthy()
  })

  it('renders email input', () => {
    renderWithProviders(<InviteSuperUserPage />)
    const emailInput = screen.getByRole('textbox', { name: /email address/i })
    expect(emailInput).toBeTruthy()
    expect((emailInput as HTMLInputElement).type).toBe('email')
  })

  it('submit button is disabled when email is empty', () => {
    renderWithProviders(<InviteSuperUserPage />)
    const submitBtn = screen.getByRole('button', {
      name: /add super user & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('submit button is disabled when email is invalid', () => {
    renderWithProviders(<InviteSuperUserPage />)
    fillValidInviteForm()
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'notanemail' },
    })
    const submitBtn = screen.getByRole('button', {
      name: /add super user & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('submit button is enabled when email is valid', () => {
    renderWithProviders(<InviteSuperUserPage />)
    fillValidInviteForm()
    const submitBtn = screen.getByRole('button', {
      name: /add super user & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('Cancel button navigates to /super-user/super-users', () => {
    renderWithProviders(<InviteSuperUserPage />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/super-user/super-users')
  })

  it('calls mutateAsync with correct payload on submit', async () => {
    const mockMutateAsync = jest
      .fn<(payload: object) => Promise<void>>()
      .mockImplementation(async () => undefined)
    mockUseInviteUserMutation.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false })

    renderWithProviders(<InviteSuperUserPage />)
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Test' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'User' } })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '9123456789' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /add super user & send link via email/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '9123456789',
        email: 'test@example.com',
        role: 'SUPER_USER',
      })
    })
  })

  it('shows error toast when mutateAsync rejects', async () => {
    mockUseInviteUserMutation.mockReturnValue({
      mutateAsync: jest
        .fn<(...args: unknown[]) => Promise<void>>()
        .mockRejectedValue(new Error('fail')),
      isPending: false,
    })

    renderWithProviders(<InviteSuperUserPage />)
    fillValidInviteForm()
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /add super user & send link via email/i }))

    await waitFor(() => {
      expect(screen.getByText(/failed to add super user/i)).toBeTruthy()
    })
  })
})
