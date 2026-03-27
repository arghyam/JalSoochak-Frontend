import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { PropsWithChildren } from 'react'
import { authApi } from '@/features/auth/services/auth-api'
import type { MyProfileResponse } from '@/features/auth/services/auth-api'
import { authQueryKeys } from './auth-query-keys'
import {
  useMyProfileQuery,
  useUpdateMyProfileMutation,
  useChangeMyPasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from './use-auth-queries'

jest.mock('@/features/auth/services/auth-api', () => ({
  authApi: {
    getMyProfile: jest.fn(),
    updateMyProfile: jest.fn(),
    changeMyPassword: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  },
}))

const mockUpdateUser = jest.fn()

jest.mock('@/app/store', () => ({
  useAuthStore: jest.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      user: {
        id: '10',
        name: 'Mukul gamer',
        email: 'mukul@beehyv.com',
        role: 'STATE_ADMIN',
        phoneNumber: '4242424242',
        tenantId: '',
        tenantCode: 'AS',
        personId: '10',
      },
      updateUser: mockUpdateUser,
    })
  ),
}))

const mockProfile: MyProfileResponse = {
  id: 10,
  email: 'mukul@beehyv.com',
  firstName: 'Mukul',
  lastName: 'gamer',
  phoneNumber: '4242424242',
  role: 'STATE_ADMIN',
  tenantCode: 'AS',
  active: true,
  createdAt: '2026-03-12T10:47:43.622177',
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useMyProfileQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses the correct query key', async () => {
    ;(authApi.getMyProfile as jest.MockedFunction<typeof authApi.getMyProfile>).mockResolvedValue(
      mockProfile
    )
    const { result } = renderHook(() => useMyProfileQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockProfile)
  })

  it('calls authApi.getMyProfile', async () => {
    ;(authApi.getMyProfile as jest.MockedFunction<typeof authApi.getMyProfile>).mockResolvedValue(
      mockProfile
    )
    renderHook(() => useMyProfileQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(authApi.getMyProfile).toHaveBeenCalledTimes(1))
  })

  it('exposes isError when query fails', async () => {
    ;(authApi.getMyProfile as jest.MockedFunction<typeof authApi.getMyProfile>).mockRejectedValue(
      new Error('Network error')
    )
    const { result } = renderHook(() => useMyProfileQuery(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('query key matches authQueryKeys.me()', () => {
    expect(authQueryKeys.me()).toEqual(['auth', 'me'])
  })
})

describe('useUpdateMyProfileMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls authApi.updateMyProfile with the payload', async () => {
    const updated = { ...mockProfile, phoneNumber: '9876567676' }
    ;(
      authApi.updateMyProfile as jest.MockedFunction<typeof authApi.updateMyProfile>
    ).mockResolvedValue(updated)
    const { result } = renderHook(() => useUpdateMyProfileMutation(), { wrapper: createWrapper() })
    result.current.mutate({ phoneNumber: '9876567676' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(authApi.updateMyProfile).toHaveBeenCalledWith({ phoneNumber: '9876567676' })
  })

  it('calls updateUser with reconstructed name and phoneNumber on success', async () => {
    const updated = {
      ...mockProfile,
      firstName: 'Mukul',
      lastName: 'Updated',
      phoneNumber: '9999999999',
    }
    ;(
      authApi.updateMyProfile as jest.MockedFunction<typeof authApi.updateMyProfile>
    ).mockResolvedValue(updated)
    const { result } = renderHook(() => useUpdateMyProfileMutation(), { wrapper: createWrapper() })
    result.current.mutate({ firstName: 'Mukul', lastName: 'Updated', phoneNumber: '9999999999' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdateUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mukul Updated', phoneNumber: '9999999999' })
    )
  })

  it('does not call updateUser on error', async () => {
    ;(
      authApi.updateMyProfile as jest.MockedFunction<typeof authApi.updateMyProfile>
    ).mockRejectedValue(new Error('Failed'))
    const { result } = renderHook(() => useUpdateMyProfileMutation(), { wrapper: createWrapper() })
    result.current.mutate({ phoneNumber: '0000000000' })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })
})

describe('useChangeMyPasswordMutation', () => {
  // Test credential values — not real passwords
  const CURRENT_CRED = 'OldPass@123'
  const NEW_CRED = 'NewPass@456'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls authApi.changeMyPassword with currentPassword and newPassword', async () => {
    ;(
      authApi.changeMyPassword as jest.MockedFunction<typeof authApi.changeMyPassword>
    ).mockResolvedValue(undefined)
    const { result } = renderHook(() => useChangeMyPasswordMutation(), { wrapper: createWrapper() })
    result.current.mutate({ currentPassword: CURRENT_CRED, newPassword: NEW_CRED })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(authApi.changeMyPassword).toHaveBeenCalledWith({
      currentPassword: CURRENT_CRED,
      newPassword: NEW_CRED,
    })
  })

  it('exposes isError when API call fails', async () => {
    ;(
      authApi.changeMyPassword as jest.MockedFunction<typeof authApi.changeMyPassword>
    ).mockRejectedValue(new Error('Wrong password'))
    const { result } = renderHook(() => useChangeMyPasswordMutation(), { wrapper: createWrapper() })
    result.current.mutate({ currentPassword: CURRENT_CRED, newPassword: NEW_CRED })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useForgotPasswordMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls authApi.forgotPassword with the provided email', async () => {
    ;(
      authApi.forgotPassword as jest.MockedFunction<typeof authApi.forgotPassword>
    ).mockResolvedValue(undefined)
    const { result } = renderHook(() => useForgotPasswordMutation(), { wrapper: createWrapper() })
    result.current.mutate('test@example.com')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(authApi.forgotPassword).toHaveBeenCalledWith('test@example.com')
  })

  it('exposes isError when API call fails', async () => {
    ;(
      authApi.forgotPassword as jest.MockedFunction<typeof authApi.forgotPassword>
    ).mockRejectedValue(new Error('Server error'))
    const { result } = renderHook(() => useForgotPasswordMutation(), { wrapper: createWrapper() })
    result.current.mutate('test@example.com')
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useResetPasswordMutation', () => {
  // Test credential values — not real passwords
  const RESET_CRED = 'Reset-test-pw1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls authApi.resetPassword with token and newPassword', async () => {
    ;(authApi.resetPassword as jest.MockedFunction<typeof authApi.resetPassword>).mockResolvedValue(
      undefined
    )
    const { result } = renderHook(() => useResetPasswordMutation(), { wrapper: createWrapper() })
    result.current.mutate({ token: 'abc123', newPassword: RESET_CRED })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(authApi.resetPassword).toHaveBeenCalledWith({ token: 'abc123', newPassword: RESET_CRED })
  })

  it('exposes isError when API call fails', async () => {
    ;(authApi.resetPassword as jest.MockedFunction<typeof authApi.resetPassword>).mockRejectedValue(
      new Error('Token expired')
    )
    const { result } = renderHook(() => useResetPasswordMutation(), { wrapper: createWrapper() })
    result.current.mutate({ token: 'expired-token', newPassword: RESET_CRED })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
