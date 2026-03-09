import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import '@/app/i18n'
import { ChangePasswordPage } from './change-password-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { AuthUser } from '@/features/auth/services/auth-api'

const mockUser: AuthUser = {
  id: 'user-1',
  name: 'Mahesh Yadav',
  email: 'mahesh@jalsoochak.com',
  role: 'state_admin',
  phoneNumber: '8564254517',
  tenantId: 'tenant-1',
  personId: 'person-1',
}

jest.mock('@/app/store', () => ({
  useAuthStore: jest.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({ user: mockUser })
  ),
}))

jest.mock('@/features/auth/services/auth-api', () => ({
  authApi: {
    changePassword: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  },
}))

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders page title', () => {
    renderWithProviders(<ChangePasswordPage />)
    expect(screen.getByRole('heading', { name: /change password/i, level: 1 })).toBeTruthy()
  })

  it('renders all three password fields', () => {
    renderWithProviders(<ChangePasswordPage />)
    expect(screen.getByLabelText(/current password/i)).toBeTruthy()
    expect(screen.getByLabelText(/^new password/i)).toBeTruthy()
    expect(screen.getByLabelText(/confirm new password/i)).toBeTruthy()
  })

  it('submit button is disabled when form is empty', () => {
    renderWithProviders(<ChangePasswordPage />)
    const btn = screen.getByRole('button', { name: /update password/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('submit button is enabled when form is valid', () => {
    renderWithProviders(<ChangePasswordPage />)
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'OldPass@123' },
    })
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'NewPass@456' },
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'NewPass@456' },
    })
    const btn = screen.getByRole('button', { name: /update password/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('shows mismatch error when confirm password differs', () => {
    renderWithProviders(<ChangePasswordPage />)
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'OldPass@123' },
    })
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'NewPass@456' },
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'Different@789' },
    })
    fireEvent.blur(screen.getByLabelText(/confirm new password/i))
    expect(screen.getByText('Passwords do not match')).toBeTruthy()
  })

  it('shows sameAsCurrent error when new password equals current', () => {
    renderWithProviders(<ChangePasswordPage />)
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'SamePass@123' },
    })
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'SamePass@123' },
    })
    fireEvent.blur(screen.getByLabelText(/^new password/i))
    expect(screen.getByText('New password must differ from current password')).toBeTruthy()
  })

  it('calls changePassword API on valid submit', async () => {
    const { authApi } = await import('@/features/auth/services/auth-api')
    renderWithProviders(<ChangePasswordPage />)
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'OldPass@123' },
    })
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'NewPass@456' },
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'NewPass@456' },
    })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith('user-1', {
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
        confirmPassword: 'NewPass@456',
      })
    })
  })

  it('clears form fields after successful submit', async () => {
    renderWithProviders(<ChangePasswordPage />)
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'OldPass@123' },
    })
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'NewPass@456' },
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'NewPass@456' },
    })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() => {
      const currentInput = screen.getByLabelText(/current password/i) as HTMLInputElement
      expect(currentInput.value).toBe('')
    })
  })
})
