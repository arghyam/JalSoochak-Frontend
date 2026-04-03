import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { PropsWithChildren } from 'react'
import { staffAuthApi } from '@/features/section-officer/services/api/staff-auth-api'
import {
  usePublicTenantsQuery,
  useRequestOtpMutation,
  useVerifyOtpMutation,
  staffAuthQueryKeys,
} from './use-staff-auth-queries'

jest.mock('@/features/section-officer/services/api/staff-auth-api', () => ({
  staffAuthApi: {
    getPublicTenants: jest.fn(),
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
  },
}))

const MOCK_TENANTS = [
  { id: 1, stateCode: 'NL', name: 'Nagaland', status: 'ACTIVE' },
  { id: 2, stateCode: 'MH', name: 'Maharashtra', status: 'ACTIVE' },
]

const MOCK_OTP_RESPONSE = { status: 200, message: 'OTP sent', otpLength: 6 }

const MOCK_LOGIN_RESPONSE = {
  user: {
    id: '15',
    name: 'Test Officer',
    email: '',
    role: 'SECTION_OFFICER',
    phoneNumber: '918179020960',
    tenantId: '50',
    tenantCode: 'NL',
    personId: '15',
  },
  accessToken: 'mock-token',
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('staffAuthQueryKeys', () => {
  it('returns stable tenants key', () => {
    expect(staffAuthQueryKeys.tenants()).toEqual(['staff', 'tenants'])
  })
})

describe('usePublicTenantsQuery', () => {
  it('fetches and returns tenants on success', async () => {
    ;(
      staffAuthApi.getPublicTenants as jest.MockedFunction<typeof staffAuthApi.getPublicTenants>
    ).mockResolvedValue(MOCK_TENANTS)

    const { result } = renderHook(() => usePublicTenantsQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(MOCK_TENANTS)
    expect(staffAuthApi.getPublicTenants).toHaveBeenCalledTimes(1)
  })

  it('surfaces error state when fetch fails', async () => {
    ;(
      staffAuthApi.getPublicTenants as jest.MockedFunction<typeof staffAuthApi.getPublicTenants>
    ).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => usePublicTenantsQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useRequestOtpMutation', () => {
  it('calls staffAuthApi.requestOtp with correct payload', async () => {
    ;(
      staffAuthApi.requestOtp as jest.MockedFunction<typeof staffAuthApi.requestOtp>
    ).mockResolvedValue(MOCK_OTP_RESPONSE)

    const { result } = renderHook(() => useRequestOtpMutation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ phoneNumber: '918179020960', tenantCode: 'NL' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(staffAuthApi.requestOtp).toHaveBeenCalledWith({
      phoneNumber: '918179020960',
      tenantCode: 'NL',
    })
    expect(result.current.data).toEqual(MOCK_OTP_RESPONSE)
  })

  it('sets error state on API failure', async () => {
    ;(
      staffAuthApi.requestOtp as jest.MockedFunction<typeof staffAuthApi.requestOtp>
    ).mockRejectedValue(new Error('OTP service unavailable'))

    const { result } = renderHook(() => useRequestOtpMutation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ phoneNumber: '918179020960', tenantCode: 'NL' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useVerifyOtpMutation', () => {
  it('calls staffAuthApi.verifyOtp with correct payload and returns LoginResponse', async () => {
    ;(
      staffAuthApi.verifyOtp as jest.MockedFunction<typeof staffAuthApi.verifyOtp>
    ).mockResolvedValue(MOCK_LOGIN_RESPONSE)

    const { result } = renderHook(() => useVerifyOtpMutation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ phoneNumber: '918179020960', tenantCode: 'NL', otp: '123456' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(staffAuthApi.verifyOtp).toHaveBeenCalledWith({
      phoneNumber: '918179020960',
      tenantCode: 'NL',
      otp: '123456',
    })
    expect(result.current.data).toEqual(MOCK_LOGIN_RESPONSE)
  })

  it('sets error state when OTP verification fails', async () => {
    ;(
      staffAuthApi.verifyOtp as jest.MockedFunction<typeof staffAuthApi.verifyOtp>
    ).mockRejectedValue(new Error('Invalid OTP'))

    const { result } = renderHook(() => useVerifyOtpMutation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ phoneNumber: '918179020960', tenantCode: 'NL', otp: '000000' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
