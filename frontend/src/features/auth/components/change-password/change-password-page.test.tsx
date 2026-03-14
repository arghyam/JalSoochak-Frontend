import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import '@/app/i18n'
import { ChangePasswordPage } from './change-password-page'
import { renderWithProviders } from '@/test/render-with-providers'

const mockMutate = jest.fn()

// Test credential values — not real passwords
const CURRENT_CRED = 'Current-test-1'
const NEW_CRED = 'New-test-2'
const SAME_CRED = 'Same-test-3'
const DIFF_CRED = 'Diff-test-4'

jest.mock('@/features/auth/services/query/use-auth-queries', () => ({
  useChangeMyPasswordMutation: jest.fn(),
}))

import { useChangeMyPasswordMutation } from '@/features/auth/services/query/use-auth-queries'

const mockUseChangeMyPasswordMutation = useChangeMyPasswordMutation as jest.MockedFunction<
  typeof useChangeMyPasswordMutation
>

function setupMutation(isPending = false) {
  mockUseChangeMyPasswordMutation.mockReturnValue({
    mutate: mockMutate,
    isPending,
  } as unknown as ReturnType<typeof useChangeMyPasswordMutation>)
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupMutation()
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
    expect(
      (screen.getByRole('button', { name: /update password/i }) as HTMLButtonElement).disabled
    ).toBe(true)
  })

  it('submit button is enabled when form is valid', () => {
    renderWithProviders(<ChangePasswordPage />)
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: CURRENT_CRED },
    })
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: NEW_CRED } })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: NEW_CRED },
    })
    expect(
      (screen.getByRole('button', { name: /update password/i }) as HTMLButtonElement).disabled
    ).toBe(false)
  })

  it('shows mismatch error when confirm password differs', () => {
    renderWithProviders(<ChangePasswordPage />)
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: CURRENT_CRED },
    })
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: NEW_CRED } })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: DIFF_CRED },
    })
    fireEvent.blur(screen.getByLabelText(/confirm new password/i))
    expect(screen.getByText('Passwords do not match')).toBeTruthy()
  })

  it('shows sameAsCurrent error when new password equals current', () => {
    renderWithProviders(<ChangePasswordPage />)
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: SAME_CRED } })
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: SAME_CRED } })
    fireEvent.blur(screen.getByLabelText(/^new password/i))
    expect(screen.getByText('New password must differ from current password')).toBeTruthy()
  })

  it('calls mutation with currentPassword and newPassword only (no confirmPassword)', async () => {
    renderWithProviders(<ChangePasswordPage />)
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: CURRENT_CRED },
    })
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: NEW_CRED } })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: NEW_CRED },
    })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { currentPassword: CURRENT_CRED, newPassword: NEW_CRED },
        expect.any(Object)
      )
      expect(mockMutate).not.toHaveBeenCalledWith(
        expect.objectContaining({ confirmPassword: expect.anything() }),
        expect.any(Object)
      )
    })
  })

  it('submit button is disabled while mutation is pending', () => {
    setupMutation(true)
    renderWithProviders(<ChangePasswordPage />)
    expect(
      (screen.getByRole('button', { name: /update password/i }) as HTMLButtonElement).disabled
    ).toBe(true)
  })

  it('toggles password visibility using localized aria-labels', () => {
    renderWithProviders(<ChangePasswordPage />)
    const showBtns = screen.getAllByRole('button', { name: /show password/i })
    expect(showBtns.length).toBe(3)
    fireEvent.click(showBtns[0])
    expect(screen.getByRole('button', { name: /hide password/i })).toBeTruthy()
  })

  it('clears form fields after successful submit via onSuccess callback', async () => {
    mockMutate.mockImplementation((_payload: unknown, opts: unknown) => {
      ;(opts as { onSuccess?: () => void })?.onSuccess?.()
    })
    renderWithProviders(<ChangePasswordPage />)
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: CURRENT_CRED },
    })
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: NEW_CRED } })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: NEW_CRED },
    })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() => {
      expect((screen.getByLabelText(/current password/i) as HTMLInputElement).value).toBe('')
    })
  })
})
