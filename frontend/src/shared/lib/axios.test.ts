import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

jest.mock('@/config/runtime-config', () => ({
  getApiBaseUrl: () => 'http://api.test',
}))

type MockAuthState = {
  accessToken: string | null
  refreshAccessToken?: jest.MockedFunction<() => Promise<string>>
  setSessionExpired?: jest.Mock
}

const mockGetState = jest.fn<() => MockAuthState>()

jest.mock('@/app/store/auth-store', () => ({
  useAuthStore: Object.assign(jest.fn(), {
    getState: () => mockGetState(),
  }),
}))

describe('apiClient request interceptor', () => {
  beforeEach(() => {
    jest.resetModules()
    mockGetState.mockReturnValue({ accessToken: 'my-token' })
  })

  it('adds Authorization header when a token is present', async () => {
    const { apiClient } = await import('./axios')
    let captured: InternalAxiosRequestConfig | undefined

    await apiClient.get('/api/v1/resource', {
      adapter: async (config) => {
        captured = config
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      },
    })

    expect(captured?.headers?.Authorization).toBe('Bearer my-token')
  })

  it.each([
    ['/api/v1/auth/login', 'post'],
    ['/api/v1/auth/refresh', 'post'],
    ['/api/v1/auth/logout', 'post'],
  ] as const)('skips Authorization for auth URL %s', async (url, method) => {
    const { apiClient } = await import('./axios')
    let captured: InternalAxiosRequestConfig | undefined

    await apiClient.request({
      url,
      method,
      data: {},
      adapter: async (config) => {
        captured = config
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      },
    })

    expect(captured?.headers?.Authorization).toBeUndefined()
  })

  it('does not set Authorization when token is missing', async () => {
    mockGetState.mockReturnValue({ accessToken: null })
    const { apiClient } = await import('./axios')
    let captured: InternalAxiosRequestConfig | undefined

    await apiClient.get('/api/v1/resource', {
      adapter: async (config) => {
        captured = config
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
      },
    })

    expect(captured?.headers?.Authorization).toBeUndefined()
  })
})

describe('apiClient response interceptor', () => {
  beforeEach(() => {
    jest.resetModules()
    mockGetState.mockReturnValue({
      accessToken: 'tok',
      refreshAccessToken: jest.fn<() => Promise<string>>().mockResolvedValue('new-tok'),
      setSessionExpired: jest.fn(),
    })
  })

  it('propagates errors that are not HTTP 401 without refreshing', async () => {
    const refreshAccessToken = mockGetState().refreshAccessToken
    const { apiClient } = await import('./axios')
    const err = new AxiosError('Bad Request')
    err.response = {
      status: 400,
      data: {},
      statusText: '',
      headers: {},
      config: { url: '/api/v1/resource', headers: {} } as InternalAxiosRequestConfig,
    }
    err.config = { url: '/api/v1/resource', headers: {} } as InternalAxiosRequestConfig

    await expect(
      apiClient.get('/api/v1/resource', {
        adapter: () => Promise.reject(err),
      })
    ).rejects.toBe(err)

    expect(refreshAccessToken!).not.toHaveBeenCalled()
  })

  it('does not attempt token refresh for 401 on auth login', async () => {
    const refreshAccessToken = mockGetState().refreshAccessToken
    const { apiClient } = await import('./axios')
    const err = new AxiosError('Unauthorized')
    err.response = {
      status: 401,
      data: {},
      statusText: '',
      headers: {},
      config: { url: '/api/v1/auth/login', headers: {} } as InternalAxiosRequestConfig,
    }
    err.config = { url: '/api/v1/auth/login', headers: {} } as InternalAxiosRequestConfig

    await expect(
      apiClient.post('/api/v1/auth/login', {}, { adapter: () => Promise.reject(err) })
    ).rejects.toBe(err)

    expect(refreshAccessToken!).not.toHaveBeenCalled()
  })

  it('does not attempt token refresh for 401 on auth register', async () => {
    const refreshAccessToken = mockGetState().refreshAccessToken
    const { apiClient } = await import('./axios')
    const err = new AxiosError('Unauthorized')
    err.response = {
      status: 401,
      data: {},
      statusText: '',
      headers: {},
      config: { url: '/api/v1/auth/register', headers: {} } as InternalAxiosRequestConfig,
    }
    err.config = { url: '/api/v1/auth/register', headers: {} } as InternalAxiosRequestConfig

    await expect(
      apiClient.post('/api/v1/auth/register', {}, { adapter: () => Promise.reject(err) })
    ).rejects.toBe(err)

    expect(refreshAccessToken!).not.toHaveBeenCalled()
  })

  it('does not attempt token refresh for 401 on auth refresh', async () => {
    const refreshAccessToken = mockGetState().refreshAccessToken
    const { apiClient } = await import('./axios')
    const err = new AxiosError('Unauthorized')
    err.response = {
      status: 401,
      data: {},
      statusText: '',
      headers: {},
      config: { url: '/api/v1/auth/refresh', headers: {} } as InternalAxiosRequestConfig,
    }
    err.config = { url: '/api/v1/auth/refresh', headers: {} } as InternalAxiosRequestConfig

    await expect(
      apiClient.post('/api/v1/auth/refresh', {}, { adapter: () => Promise.reject(err) })
    ).rejects.toBe(err)

    expect(refreshAccessToken!).not.toHaveBeenCalled()
  })

  it('retries original request after successful refresh on 401', async () => {
    const refreshAccessToken = jest.fn<() => Promise<string>>().mockResolvedValue('new-tok')
    mockGetState.mockReturnValue({
      accessToken: 'old',
      refreshAccessToken,
      setSessionExpired: jest.fn(),
    })
    const { apiClient } = await import('./axios')
    let attempt = 0
    const result = await apiClient.get('/api/v1/resource', {
      adapter: async (config) => {
        attempt += 1
        if (attempt === 1) {
          const err = new AxiosError('Unauthorized')
          err.response = {
            status: 401,
            data: {},
            statusText: '',
            headers: {},
            config: config as InternalAxiosRequestConfig,
          }
          err.config = config as InternalAxiosRequestConfig
          return Promise.reject(err)
        }
        return {
          data: { ok: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config as InternalAxiosRequestConfig,
        }
      },
    })
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(result.data).toEqual({ ok: true })
  })

  it('calls setSessionExpired when refresh fails', async () => {
    const setSessionExpired = jest.fn()
    const refreshAccessToken = jest
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error('refresh failed'))
    mockGetState.mockReturnValue({
      accessToken: 'old',
      refreshAccessToken,
      setSessionExpired,
    })
    const { apiClient } = await import('./axios')
    const err = new AxiosError('Unauthorized')
    err.response = {
      status: 401,
      data: {},
      statusText: '',
      headers: {},
      config: { url: '/api/v1/resource', headers: {} } as InternalAxiosRequestConfig,
    }
    err.config = { url: '/api/v1/resource', headers: {} } as InternalAxiosRequestConfig

    await expect(
      apiClient.get('/api/v1/resource', { adapter: () => Promise.reject(err) })
    ).rejects.toThrow()

    expect(setSessionExpired).toHaveBeenCalled()
  })

  it('does not refresh again when retried request returns 401', async () => {
    const refreshAccessToken = jest.fn<() => Promise<string>>().mockResolvedValue('new-tok')
    mockGetState.mockReturnValue({
      accessToken: 'old',
      refreshAccessToken,
      setSessionExpired: jest.fn(),
    })
    const { apiClient } = await import('./axios')
    const make401 = (config: InternalAxiosRequestConfig) => {
      const err = new AxiosError('Unauthorized')
      err.response = {
        status: 401,
        data: {},
        statusText: '',
        headers: {},
        config,
      }
      err.config = config
      return Promise.reject(err)
    }

    await expect(
      apiClient.get('/api/v1/resource', {
        adapter: async (config) => {
          return make401(config as InternalAxiosRequestConfig)
        },
      })
    ).rejects.toMatchObject({ response: { status: 401 } })

    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
  })

  it('propagates errors without response status', async () => {
    mockGetState.mockReturnValue({
      accessToken: 't',
      refreshAccessToken: jest.fn(),
      setSessionExpired: jest.fn(),
    })
    const { apiClient } = await import('./axios')
    const err = new AxiosError('Network')
    err.config = { url: '/api/v1/x', headers: {} } as InternalAxiosRequestConfig

    await expect(apiClient.get('/api/v1/x', { adapter: () => Promise.reject(err) })).rejects.toBe(
      err
    )
  })
})
