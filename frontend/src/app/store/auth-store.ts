import { create } from 'zustand'
import type { AuthUser, LoginRequest, LoginResponse } from '@/features/auth/services/auth-api'
import { authApi } from '@/features/auth/services/auth-api'
import { AUTH_ROLES, STAFF_ROLES } from '@/shared/constants/auth'
import { ROUTES } from '@/shared/constants/routes'

export interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  loading: boolean
  error: string | null
  login: (payload: LoginRequest) => Promise<string>
  logout: () => Promise<void>
  bootstrap: () => Promise<void>
  updateUser: (user: AuthUser) => void
  setFromActivation: (response: LoginResponse) => string
  sessionExpired: boolean
  setSessionExpired: () => void
  refreshAccessToken: () => Promise<string>
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,
  loading: false,
  error: null,
  sessionExpired: false,

  login: async (payload: LoginRequest) => {
    set({ loading: true, error: null, sessionExpired: false })
    try {
      const { user, accessToken } = await authApi.login(payload)

      set({
        accessToken,
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      })

      if (user.role === AUTH_ROLES.SUPER_ADMIN) {
        return '/super-user'
      } else if (user.role === AUTH_ROLES.STATE_ADMIN) {
        return '/state-admin'
      } else if (STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number])) {
        return ROUTES.STAFF
      } else {
        return '/'
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to login. Please try again.'
      set({
        loading: false,
        error: message,
        accessToken: null,
        user: null,
        isAuthenticated: false,
      })
      throw error
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    }

    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      error: null,
      sessionExpired: false,
    })
  },

  bootstrap: async () => {
    try {
      const { user, accessToken } = await authApi.refresh()
      set({
        isBootstrapping: false,
        accessToken,
        user,
        isAuthenticated: true,
        sessionExpired: false,
        error: null,
      })
    } catch {
      set({
        isBootstrapping: false,
        accessToken: null,
        user: null,
        isAuthenticated: false,
      })
    }
  },

  setSessionExpired: () => {
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      sessionExpired: true,
      error: 'Session expired. Please log in again.',
    })
  },

  updateUser: (user: AuthUser) => {
    set({ user })
  },

  setFromActivation: ({ user, accessToken }: LoginResponse) => {
    set({ accessToken, user, isAuthenticated: true, error: null, sessionExpired: false })
    if (user.role === AUTH_ROLES.SUPER_ADMIN) return '/super-user'
    if (user.role === AUTH_ROLES.STATE_ADMIN) return '/state-admin'
    if (STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number])) return ROUTES.STAFF
    return '/'
  },

  refreshAccessToken: async () => {
    try {
      const { user, accessToken } = await authApi.refresh()
      set({
        accessToken,
        user,
        isAuthenticated: true,
        sessionExpired: false,
      })
      return accessToken
    } catch (error) {
      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
      })
      throw error
    }
  },
}))
