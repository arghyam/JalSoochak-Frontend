import axios from 'axios'
import { useAuthStore } from '@/app/store/auth-store'
import { getApiBaseUrl } from '@/config/runtime-config'

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const publicApiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth endpoints that should not receive the Authorization header
const AUTH_ENDPOINTS = ['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout']

// Request interceptor to add access token
apiClient.interceptors.request.use(
  (config) => {
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => config.url?.includes(ep))
    if (!isAuthEndpoint) {
      const accessToken = useAuthStore.getState().accessToken
      if (accessToken) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${accessToken}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false
const pendingRequests: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

// Response interceptor with auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const originalRequest = error.config

    if (!status || status !== 401) {
      return Promise.reject(error)
    }

    if (
      originalRequest?.url?.includes('/api/v1/auth/login') ||
      originalRequest?.url?.includes('/api/v1/auth/refresh') ||
      originalRequest?.url?.includes('/api/v1/auth/register') ||
      originalRequest?._retry
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingRequests.push({ resolve, reject })
      }).then((newToken) => {
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      })
    }

    // Start the refresh
    isRefreshing = true
    const { setSessionExpired } = useAuthStore.getState()

    try {
      const newAccessToken = await useAuthStore.getState().refreshAccessToken()

      if (!newAccessToken) {
        throw new Error('Failed to refresh access token')
      }

      // Resolve all queued requests with the new token
      for (const pending of pendingRequests) {
        pending.resolve(newAccessToken)
      }
      pendingRequests.length = 0

      // Retry the original request
      originalRequest.headers = originalRequest.headers ?? {}
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      // Reject all queued requests
      for (const pending of pendingRequests) {
        pending.reject(refreshError)
      }
      pendingRequests.length = 0
      setSessionExpired()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default apiClient
