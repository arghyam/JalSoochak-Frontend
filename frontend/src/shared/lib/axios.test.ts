import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import type { InternalAxiosRequestConfig } from 'axios'

jest.mock('@/config/runtime-config', () => ({
  getApiBaseUrl: () => 'http://api.test',
}))

const mockGetState = jest.fn()

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

  it('skips Authorization for auth login URL', async () => {
    const { apiClient } = await import('./axios')
    let captured: InternalAxiosRequestConfig | undefined

    await apiClient.post(
      '/api/v1/auth/login',
      {},
      {
        adapter: async (config) => {
          captured = config
          return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
        },
      }
    )

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
