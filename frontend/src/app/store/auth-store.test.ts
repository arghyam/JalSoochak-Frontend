import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals'
import { authApi } from '@/features/auth/services/auth-api'
import type { AuthUser } from '@/features/auth/services/auth-api'
import { AUTH_ROLES } from '@/shared/constants/auth'
import { ROUTES } from '@/shared/constants/routes'
import { useAuthStore } from './auth-store'

jest.mock('@/features/auth/services/auth-api', () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
  },
}))

const mockedAuth = jest.mocked(authApi)

const stateAdminUser: AuthUser = {
  id: '1',
  name: 'Admin',
  email: 'a@x.com',
  role: AUTH_ROLES.STATE_ADMIN,
  phoneNumber: '111',
  tenantId: '10',
  tenantCode: 'MH',
  personId: 'p1',
}

function resetStoreSlice() {
  useAuthStore.setState({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isBootstrapping: false,
    loading: false,
    error: null,
    sessionExpired: false,
  })
}

describe('useAuthStore', () => {
  const originalTitle = document.title

  beforeEach(() => {
    jest.clearAllMocks()
    resetStoreSlice()
  })

  afterEach(() => {
    document.title = originalTitle
  })

  it('login succeeds and returns state-admin path for state admin role', async () => {
    mockedAuth.login.mockResolvedValue({
      user: stateAdminUser,
      accessToken: 'tok',
    })

    const path = await useAuthStore.getState().login({
      email: 'a@x.com',
      password: 'secret',
    })

    expect(path).toBe('/state-admin')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().accessToken).toBe('tok')
    expect(useAuthStore.getState().error).toBeNull()
  })

  it('login maps staff roles to staff route', async () => {
    const staffUser = { ...stateAdminUser, role: AUTH_ROLES.SECTION_OFFICER }
    mockedAuth.login.mockResolvedValue({ user: staffUser, accessToken: 't' })

    const path = await useAuthStore.getState().login({
      email: 'a@x.com',
      password: 'secret',
    })

    expect(path).toBe(ROUTES.STAFF)
  })

  it('login records error and clears session on failure', async () => {
    mockedAuth.login.mockRejectedValue(new Error('bad creds'))

    await expect(
      useAuthStore.getState().login({ email: 'a@x.com', password: 'x' })
    ).rejects.toThrow('bad creds')

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().error).toBe('bad creds')
  })

  it('bootstrap sets authenticated state when refresh succeeds', async () => {
    mockedAuth.refresh.mockResolvedValue({
      user: stateAdminUser,
      accessToken: 'refreshed',
    })

    await useAuthStore.getState().bootstrap()

    expect(useAuthStore.getState().isBootstrapping).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().accessToken).toBe('refreshed')
  })

  it('bootstrap clears session when refresh fails', async () => {
    mockedAuth.refresh.mockRejectedValue(new Error('expired'))

    await useAuthStore.getState().bootstrap()

    expect(useAuthStore.getState().isBootstrapping).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('logout clears auth state and resets document title', async () => {
    useAuthStore.setState({
      accessToken: 'x',
      user: stateAdminUser,
      isAuthenticated: true,
    })
    document.title = 'Other'
    mockedAuth.logout.mockResolvedValue(undefined)

    await useAuthStore.getState().logout()

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(document.title).toBe('JalSoochak')
  })

  it('setSessionExpired clears tokens and flags session', () => {
    useAuthStore.setState({
      accessToken: 'x',
      user: stateAdminUser,
      isAuthenticated: true,
    })
    document.title = 'X'

    useAuthStore.getState().setSessionExpired()

    expect(useAuthStore.getState().sessionExpired).toBe(true)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().error).toMatch(/Session expired/i)
    expect(document.title).toBe('JalSoochak')
  })

  it('refreshAccessToken rethrows and clears auth on failure', async () => {
    mockedAuth.refresh.mockRejectedValue(new Error('nope'))

    await expect(useAuthStore.getState().refreshAccessToken()).rejects.toThrow('nope')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
