import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { PropsWithChildren } from 'react'
import enSectionOfficer from '@/locales/en/section-officer.json'
import { StaffLoginPage } from './staff-login-page'

function resolveTranslation(
  translations: Record<string, unknown>,
  key: string,
  opts?: Record<string, unknown>
): string {
  const parts = key.split('.')
  let value: unknown = translations
  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part]
    } else {
      return key
    }
  }
  if (typeof value !== 'string') return key
  if (opts) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts[k] ?? `{{${k}}}`))
  }
  return value
}

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      resolveTranslation(enSectionOfficer as Record<string, unknown>, key, opts),
    i18n: { changeLanguage: jest.fn() },
  }),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockSetFromActivation = jest.fn()
jest.mock('@/app/store', () => ({
  useAuthStore: jest.fn(() => ({
    setFromActivation: mockSetFromActivation,
  })),
}))

const mockRequestOtpMutate = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockVerifyOtpMutate = jest.fn<(...args: unknown[]) => Promise<unknown>>()

jest.mock('@/features/section-officer/services/query/use-staff-auth-queries', () => ({
  usePublicTenantsQuery: jest.fn(() => ({
    data: [
      { id: 1, stateCode: 'NL', name: 'Nagaland', status: 'ACTIVE' },
      { id: 2, stateCode: 'MH', name: 'Maharashtra', status: 'ACTIVE' },
    ],
    isLoading: false,
  })),
  useRequestOtpMutation: jest.fn(() => ({
    mutateAsync: mockRequestOtpMutate,
    isPending: false,
  })),
  useVerifyOtpMutation: jest.fn(() => ({
    mutateAsync: mockVerifyOtpMutate,
    isPending: false,
  })),
}))

jest.mock('@/features/auth/components/signup/auth-side-image', () => ({
  AuthSideImage: () => null,
}))

jest.mock('@/assets/media/logo.svg', () => 'logo.svg')

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(
      MemoryRouter,
      {},
      createElement(QueryClientProvider, { client: queryClient }, children)
    )
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('StaffLoginPage — Phone Step', () => {
  it('renders heading, phone input, tenant select and Send OTP button', () => {
    render(<StaffLoginPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Welcome')).toBeTruthy()
    expect(screen.getByTestId('phone-input')).toBeTruthy()
    expect(screen.getByTestId('send-otp-button')).toBeTruthy()
    expect(screen.getByText('+91')).toBeTruthy()
  })

  it('shows validation error when phone is empty', async () => {
    render(<StaffLoginPage />, { wrapper: createWrapper() })

    await act(async () => {
      fireEvent.click(screen.getByTestId('send-otp-button'))
    })

    expect(screen.getByText(enSectionOfficer.login.phoneStep.phoneError)).toBeTruthy()
  })

  it('shows validation error when tenant is not selected', async () => {
    render(<StaffLoginPage />, { wrapper: createWrapper() })
    const phoneInput = screen.getByTestId('phone-input')
    await userEvent.type(phoneInput, '8179020960')

    await act(async () => {
      fireEvent.click(screen.getByTestId('send-otp-button'))
    })

    expect(screen.getByText(enSectionOfficer.login.phoneStep.stateError)).toBeTruthy()
  })

  it('calls requestOtp mutation with prefixed phone and tenantCode on valid submit', async () => {
    mockRequestOtpMutate.mockResolvedValueOnce({ status: 200, message: 'OTP sent', otpLength: 6 })
    render(<StaffLoginPage />, { wrapper: createWrapper() })

    await userEvent.type(screen.getByTestId('phone-input'), '8179020960')
    // Open tenant select and pick an option
    await act(async () => {
      fireEvent.click(screen.getByRole('combobox'))
    })
    await act(async () => {
      fireEvent.click(screen.getByText('Nagaland'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('send-otp-button'))
    })

    await waitFor(() => {
      expect(mockRequestOtpMutate).toHaveBeenCalledWith({
        phoneNumber: '918179020960',
        tenantCode: 'NL',
      })
    })
  })

  it('shows error message when requestOtp API fails', async () => {
    mockRequestOtpMutate.mockRejectedValueOnce(new Error('API error'))
    render(<StaffLoginPage />, { wrapper: createWrapper() })

    await userEvent.type(screen.getByTestId('phone-input'), '8179020960')
    await act(async () => {
      fireEvent.click(screen.getByRole('combobox'))
    })
    await act(async () => {
      fireEvent.click(screen.getByText('Nagaland'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('send-otp-button'))
    })

    await waitFor(() => {
      expect(screen.getByText(enSectionOfficer.login.phoneStep.sendOtpFailed)).toBeTruthy()
    })
  })
})

describe('StaffLoginPage — OTP Step', () => {
  async function renderAtOtpStep() {
    mockRequestOtpMutate.mockResolvedValueOnce({ status: 200, message: 'OTP sent', otpLength: 4 })
    render(<StaffLoginPage />, { wrapper: createWrapper() })

    await userEvent.type(screen.getByTestId('phone-input'), '8179020960')
    await act(async () => {
      fireEvent.click(screen.getByRole('combobox'))
    })
    await act(async () => {
      fireEvent.click(screen.getByText('Nagaland'))
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('send-otp-button'))
    })
    await waitFor(() => expect(screen.getByTestId('otp-inputs')).toBeTruthy())
    // Flush autoFocus-triggered Chakra FormControl state updates
    await act(async () => {})
  }

  it('renders correct number of OTP inputs based on otpLength from API response', async () => {
    await renderAtOtpStep()
    const inputs = screen.getAllByTestId(/^otp-input-/)
    expect(inputs).toHaveLength(4)
  })

  it('renders masked phone number in subtitle', async () => {
    await renderAtOtpStep()
    expect(screen.getByText(/\+91 \*{6}0960/)).toBeTruthy()
  })

  it('shows Back button that returns to phone step', async () => {
    await renderAtOtpStep()
    await act(async () => {
      fireEvent.click(screen.getByTestId('back-button'))
    })
    expect(screen.getByTestId('phone-input')).toBeTruthy()
  })

  it('Resend button is disabled during cooldown', async () => {
    await renderAtOtpStep()
    expect(screen.queryByTestId('resend-otp-button')).toBeNull()
    expect(screen.getByText(/Resend in/)).toBeTruthy()
  })

  it('calls verifyOtp with correct payload on login', async () => {
    mockVerifyOtpMutate.mockResolvedValueOnce({
      user: {
        id: '15',
        name: 'Officer',
        email: '',
        role: 'SECTION_OFFICER',
        phoneNumber: '918179020960',
        tenantId: '50',
        tenantCode: 'NL',
        personId: '15',
      },
      accessToken: 'token',
    })
    mockSetFromActivation.mockReturnValueOnce('/staff')

    await renderAtOtpStep()

    for (let i = 0; i < 4; i++) {
      fireEvent.change(screen.getByTestId(`otp-input-${i}`), { target: { value: String(i + 1) } })
    }

    await act(async () => {
      fireEvent.click(screen.getByTestId('login-button'))
    })

    await waitFor(() => {
      expect(mockVerifyOtpMutate).toHaveBeenCalledWith({
        phoneNumber: '918179020960',
        tenantCode: 'NL',
        otp: '1234',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/staff', { replace: true })
    })
  })

  it('shows error message when verifyOtp fails', async () => {
    mockVerifyOtpMutate.mockRejectedValueOnce(new Error('Invalid OTP'))
    await renderAtOtpStep()

    for (let i = 0; i < 4; i++) {
      fireEvent.change(screen.getByTestId(`otp-input-${i}`), { target: { value: '1' } })
    }

    await act(async () => {
      fireEvent.click(screen.getByTestId('login-button'))
    })

    await waitFor(() => {
      expect(screen.getByText(enSectionOfficer.login.otpStep.invalidOtp)).toBeTruthy()
    })
  })

  it('disables login button until OTP is complete', async () => {
    await renderAtOtpStep()

    expect((screen.getByTestId('login-button') as HTMLButtonElement).disabled).toBe(true)
  })
})
