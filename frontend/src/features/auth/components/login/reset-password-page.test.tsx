import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import '@/app/i18n'
import { ResetPasswordPage } from './reset-password-page'
import { renderWithProviders } from '@/test/render-with-providers'

const mockMutate = jest.fn()
const mockNavigate = jest.fn()

// Test credential values — not real passwords
const NEW_CRED = 'New-test-pw1'
const DIFF_CRED = 'Diff-test-pw2'

jest.mock('react-router-dom', () => ({
  useSearchParams: jest.fn(),
  useNavigate: jest.fn(),
}))

jest.mock('@/features/auth/services/query/use-auth-queries', () => ({
  useResetPasswordMutation: jest.fn(),
}))

import { useSearchParams, useNavigate } from 'react-router-dom'
import { useResetPasswordMutation } from '@/features/auth/services/query/use-auth-queries'

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>
const mockUseResetPasswordMutation = useResetPasswordMutation as jest.MockedFunction<
  typeof useResetPasswordMutation
>

function setupWithToken(token: string | null = 'valid-token-abc') {
  const params = new URLSearchParams(token ? { token } : {})
  mockUseSearchParams.mockReturnValue([params, jest.fn()] as unknown as ReturnType<
    typeof useSearchParams
  >)
  mockUseNavigate.mockReturnValue(mockNavigate as unknown as ReturnType<typeof useNavigate>)
  mockUseResetPasswordMutation.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useResetPasswordMutation>)
}

describe('ResetPasswordPage — no token', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupWithToken(null)
  })

  it('renders invalid link error state', () => {
    renderWithProviders(<ResetPasswordPage />)
    expect(screen.getByText(/invalid reset link/i)).toBeTruthy()
  })

  it('renders Back to Login button', () => {
    renderWithProviders(<ResetPasswordPage />)
    expect(screen.getByRole('button', { name: /back to login/i })).toBeTruthy()
  })

  it('does not render the password form', () => {
    renderWithProviders(<ResetPasswordPage />)
    expect(screen.queryByPlaceholderText(/enter new password/i)).toBeNull()
  })

  it('navigates to login when Back to Login is clicked', () => {
    renderWithProviders(<ResetPasswordPage />)
    fireEvent.click(screen.getByRole('button', { name: /back to login/i }))
    expect(mockNavigate).toHaveBeenCalled()
  })
})

describe('ResetPasswordPage — with token', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupWithToken()
  })

  it('renders Reset password heading', () => {
    renderWithProviders(<ResetPasswordPage />)
    expect(screen.getByText('Reset password')).toBeTruthy()
  })

  it('renders new password and confirm password fields', () => {
    renderWithProviders(<ResetPasswordPage />)
    expect(screen.getByPlaceholderText(/enter new password/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/confirm new password/i)).toBeTruthy()
  })

  it('does not render the old "password sent via email" field', () => {
    renderWithProviders(<ResetPasswordPage />)
    expect(screen.queryByText(/password sent via email/i)).toBeNull()
  })

  it('submit button is disabled when fields are empty', () => {
    renderWithProviders(<ResetPasswordPage />)
    expect(
      (screen.getByRole('button', { name: /reset password/i }) as HTMLButtonElement).disabled
    ).toBe(true)
  })

  it('submit button is disabled when passwords do not match', () => {
    renderWithProviders(<ResetPasswordPage />)
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), {
      target: { value: NEW_CRED },
    })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
      target: { value: DIFF_CRED },
    })
    expect(
      (screen.getByRole('button', { name: /reset password/i }) as HTMLButtonElement).disabled
    ).toBe(true)
  })

  it('submit button is enabled when passwords match', () => {
    renderWithProviders(<ResetPasswordPage />)
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), {
      target: { value: NEW_CRED },
    })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
      target: { value: NEW_CRED },
    })
    expect(
      (screen.getByRole('button', { name: /reset password/i }) as HTMLButtonElement).disabled
    ).toBe(false)
  })

  it('calls mutation with token from URL and new password', async () => {
    renderWithProviders(<ResetPasswordPage />)
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), {
      target: { value: NEW_CRED },
    })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
      target: { value: NEW_CRED },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { token: 'valid-token-abc', newPassword: NEW_CRED },
        expect.any(Object)
      )
    })
  })

  it('navigates to login on success', async () => {
    mockMutate.mockImplementation((_payload: unknown, opts: unknown) => {
      ;(opts as { onSuccess?: () => void })?.onSuccess?.()
    })
    renderWithProviders(<ResetPasswordPage />)
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), {
      target: { value: NEW_CRED },
    })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
      target: { value: NEW_CRED },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

  it('shows API error message on failure', async () => {
    mockMutate.mockImplementation((_payload: unknown, opts: unknown) => {
      ;(opts as { onError?: (e: Error) => void })?.onError?.(new Error('Token expired'))
    })
    renderWithProviders(<ResetPasswordPage />)
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), {
      target: { value: NEW_CRED },
    })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), {
      target: { value: NEW_CRED },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))
    await waitFor(() => {
      expect(screen.getByText('Token expired')).toBeTruthy()
    })
  })

  it('submit button is disabled while mutation is pending', () => {
    mockUseResetPasswordMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    } as unknown as ReturnType<typeof useResetPasswordMutation>)
    renderWithProviders(<ResetPasswordPage />)
    // Chakra replaces button text with loadingText ("Resetting...") when isLoading
    expect((screen.getByRole('button', { name: /resetting/i }) as HTMLButtonElement).disabled).toBe(
      true
    )
  })
})
