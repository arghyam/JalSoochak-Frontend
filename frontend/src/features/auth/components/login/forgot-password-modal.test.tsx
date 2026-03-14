import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import '@/app/i18n'
import { ForgotPasswordModal } from './forgot-password-modal'
import { renderWithProviders } from '@/test/render-with-providers'

const mockMutate = jest.fn()
const mockOnClose = jest.fn()

jest.mock('@/features/auth/services/query/use-auth-queries', () => ({
  useForgotPasswordMutation: jest.fn(),
}))

import { useForgotPasswordMutation } from '@/features/auth/services/query/use-auth-queries'

const mockUseForgotPasswordMutation = useForgotPasswordMutation as jest.MockedFunction<
  typeof useForgotPasswordMutation
>

function setupMutation(isPending = false) {
  mockUseForgotPasswordMutation.mockReturnValue({
    mutate: mockMutate,
    isPending,
  } as unknown as ReturnType<typeof useForgotPasswordMutation>)
}

function renderModal(isOpen = true) {
  return renderWithProviders(<ForgotPasswordModal isOpen={isOpen} onClose={mockOnClose} />)
}

describe('ForgotPasswordModal — closed', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupMutation()
  })

  it('renders nothing when closed', () => {
    renderModal(false)
    expect(screen.queryByPlaceholderText(/enter your email/i)).toBeNull()
  })
})

describe('ForgotPasswordModal — form view', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupMutation()
  })

  it('renders email input', () => {
    renderModal()
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeTruthy()
  })

  it('renders Send Reset Link and Cancel buttons', () => {
    renderModal()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy()
  })

  it('shows required error when submitting with empty email', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(screen.getByText('Email is required.')).toBeTruthy()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows format error for invalid email', () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'not-an-email' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy()
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('clears email error when user starts typing', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(screen.getByText('Email is required.')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'a' },
    })
    expect(screen.queryByText('Email is required.')).toBeNull()
  })

  it('calls mutation with trimmed email on valid submit', () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: '  test@example.com  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(mockMutate).toHaveBeenCalledWith('test@example.com', expect.any(Object))
  })

  it('calls onClose when Cancel is clicked', () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('disables Cancel button while pending', () => {
    setupMutation(true)
    renderModal()
    expect((screen.getByRole('button', { name: /cancel/i }) as HTMLButtonElement).disabled).toBe(
      true
    )
  })

  it('shows loading on Send Reset Link while pending', () => {
    setupMutation(true)
    renderModal()
    // Button in loading state renders with aria-busy or loading text
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeTruthy()
  })

  it('shows API error in email field when mutation fails', async () => {
    mockMutate.mockImplementation((_email: unknown, opts: unknown) => {
      ;(opts as { onError?: (e: Error) => void })?.onError?.(new Error('Something went wrong'))
    })
    renderModal()
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeTruthy()
    })
  })
})

describe('ForgotPasswordModal — success view', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMutate.mockImplementation((_email: unknown, opts: unknown) => {
      ;(opts as { onSuccess?: () => void })?.onSuccess?.()
    })
    setupMutation()
  })

  it('shows success message after successful submission', async () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => {
      expect(screen.getByText(/reset link has been sent/i)).toBeTruthy()
    })
  })

  it('shows Back to Login button in success view', async () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to login/i })).toBeTruthy()
    })
  })

  it('calls onClose when Back to Login is clicked', async () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => screen.getByRole('button', { name: /back to login/i }))
    fireEvent.click(screen.getByRole('button', { name: /back to login/i }))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
