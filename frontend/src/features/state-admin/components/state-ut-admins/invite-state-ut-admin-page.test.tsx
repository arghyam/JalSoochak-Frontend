import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { InviteStateUTAdminPage } from './invite-state-ut-admin-page'
import { renderWithProviders } from '@/test/render-with-providers'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockMutateAsync =
  jest.fn<
    (input: {
      firstName: string
      lastName: string
      phoneNumber: string
      email: string
      tenantCode: string
    }) => Promise<void>
  >()
const mockUseInviteStateUTAdminMutation = jest.fn()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useInviteStateUTAdminMutation: () => mockUseInviteStateUTAdminMutation(),
}))

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: (selector?: (s: { user: { tenantCode: string } }) => unknown) => {
    const mockState = { user: { tenantCode: 'MH' } }
    return selector ? selector(mockState) : mockState
  },
}))

const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
  fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '9876543210' } })
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'john@example.com' },
  })
}

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

  it('renders all four form fields', () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    expect(screen.getByLabelText(/first name/i)).toBeTruthy()
    expect(screen.getByLabelText(/last name/i)).toBeTruthy()
    expect(screen.getByLabelText(/phone number/i)).toBeTruthy()
    expect(screen.getByLabelText(/email address/i)).toBeTruthy()
  })

  it('submit button is disabled when form is empty', () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    const submitBtn = screen.getByRole('button', {
      name: /add admin & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true)
  })

  describe('first name validation', () => {
    it('shows required error when blurred empty', () => {
      renderWithProviders(<InviteStateUTAdminPage />)
      fireEvent.blur(screen.getByLabelText(/first name/i))
      expect(screen.getByText(/this field is required/i)).toBeTruthy()
    })

    it('shows alphabetic error when non-alpha chars entered', () => {
      renderWithProviders(<InviteStateUTAdminPage />)
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: 'john@example.com' },
      })
      fireEvent.blur(screen.getByLabelText(/first name/i))
      expect(screen.getByText(/only letters and spaces are allowed/i)).toBeTruthy()
    })

    it('does not show error for valid name', () => {
      renderWithProviders(<InviteStateUTAdminPage />)
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
      fireEvent.blur(screen.getByLabelText(/first name/i))
      expect(screen.queryByText(/only letters and spaces are allowed/i)).toBeNull()
    })
  })

  describe('last name validation', () => {
    it('shows required error when blurred empty', () => {
      renderWithProviders(<InviteStateUTAdminPage />)
      fireEvent.blur(screen.getByLabelText(/last name/i))
      expect(screen.getByText(/this field is required/i)).toBeTruthy()
    })

    it('shows alphabetic error when non-alpha chars entered', () => {
      renderWithProviders(<InviteStateUTAdminPage />)
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: 'doe123' },
      })
      fireEvent.blur(screen.getByLabelText(/last name/i))
      expect(screen.getByText(/only letters and spaces are allowed/i)).toBeTruthy()
    })
  })

  describe('phone number validation', () => {
    it('shows required error when blurred empty', () => {
      renderWithProviders(<InviteStateUTAdminPage />)
      fireEvent.blur(screen.getByLabelText(/phone number/i))
      expect(screen.getByText(/this field is required/i)).toBeTruthy()
    })

    it('shows invalid error for partial phone number', () => {
      renderWithProviders(<InviteStateUTAdminPage />)
      fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '12345' } })
      fireEvent.blur(screen.getByLabelText(/phone number/i))
      expect(screen.getByText(/valid 10-digit phone/i)).toBeTruthy()
    })

    it('does not show error for valid 10-digit phone', () => {
      renderWithProviders(<InviteStateUTAdminPage />)
      fireEvent.change(screen.getByLabelText(/phone number/i), {
        target: { value: '9876543210' },
      })
      fireEvent.blur(screen.getByLabelText(/phone number/i))
      expect(screen.queryByText(/valid 10-digit phone/i)).toBeNull()
    })
  })

  describe('email validation', () => {
    it('shows required error when blurred empty', () => {
      renderWithProviders(<InviteStateUTAdminPage />)
      fireEvent.blur(screen.getByLabelText(/email address/i))
      expect(screen.getByText(/this field is required/i)).toBeTruthy()
    })

    it('shows invalid error for malformed email', () => {
      renderWithProviders(<InviteStateUTAdminPage />)
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'not-an-email' },
      })
      fireEvent.blur(screen.getByLabelText(/email address/i))
      expect(screen.getByText(/valid email address/i)).toBeTruthy()
    })

    it('does not show error for valid email', () => {
      renderWithProviders(<InviteStateUTAdminPage />)
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.blur(screen.getByLabelText(/email address/i))
      expect(screen.queryByText(/valid email address/i)).toBeNull()
    })
  })

  it('submit button is enabled only when all fields are valid', () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    fillValidForm()
    const submitBtn = screen.getByRole('button', {
      name: /add admin & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('submit button remains disabled when first name contains non-alpha chars', () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '9876543210' } })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john@example.com' },
    })
    const submitBtn = screen.getByRole('button', {
      name: /add admin & send link via email/i,
    })
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('Cancel navigates to /state-admin/state-ut-admins', () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/state-admin/state-ut-admins')
  })

  it('calls mutateAsync with all fields on submit', async () => {
    renderWithProviders(<InviteStateUTAdminPage />)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /add admin & send link via email/i }))
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        email: 'john@example.com',
        tenantCode: 'MH',
      })
    })
  })

  it('shows error toast when mutateAsync rejects', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Server error'))
    renderWithProviders(<InviteStateUTAdminPage />)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /add admin & send link via email/i }))
    await waitFor(() => {
      expect(screen.getByText(/failed to add state\/ut admin/i)).toBeTruthy()
    })
  })
})
