import { isAxiosError } from 'axios'
import apiClient from '@/shared/lib/axios'
import { extractUserFromJWT } from '@/shared/utils/jwt'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
  personType: string
  tenantId: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  id_token: string
  expires_in: number
  refresh_expires_in: number
  token_type: string
  user_role: string
  tenant_id: string
  person_id: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface LogoutRequest {
  refreshToken: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  phoneNumber: string
  tenantId: string
  personId: string
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export interface InviteUserResponse {
  email: string
}

export interface SetPasswordRequest {
  userId: string
  emailId: string
  newPassword: string
  confirmPassword: string
  tenantCode?: string
  tenantId?: string
}

export interface SetPasswordResponse {
  message: string
}

/** Build a typed SetPasswordRequest for POST /api/v2/user/set-password. */
export function buildSetPasswordRequest(params: {
  userId: string
  emailId: string
  newPassword: string
  confirmPassword: string
  tenantCode?: string
  tenantId?: string
}): SetPasswordRequest {
  return {
    userId: params.userId,
    emailId: params.emailId,
    newPassword: params.newPassword,
    confirmPassword: params.confirmPassword,
    ...(params.tenantCode && { tenantCode: params.tenantCode }),
    ...(params.tenantId && { tenantId: params.tenantId }),
  }
}

/** Request body for PUT /api/v2/user/:userId (update profile). */
export interface UpdateProfileRequest {
  role: string
  firstname: string
  lastname: string
  primaryemail: string
  secondaryemail?: string
  primarynumber: string
  secondarynumber?: string
}

/** Success response for PUT /api/v2/user/:userId. */
export interface UpdateProfileResponse {
  message: string
}

/** Response for GET /api/v2/user/:userId. */
export interface UserProfileResponse {
  userId: string
  firstName: string
  lastName: string
  primaryEmail: string
  secondaryEmail?: string
  primaryNumber: string
  secondaryNumber?: string
  role: string
  status: string
  tenantCode?: string
  tenantId?: string
  createdAt: string
  updatedAt: string
}

/** Build a typed UpdateProfileRequest for PUT /api/v2/user/:userId. */
export function buildUpdateProfileRequest(params: {
  role: string
  firstName: string
  lastName: string
  primaryEmail: string
  secondaryEmail?: string
  primaryNumber: string
  secondaryNumber?: string
}): UpdateProfileRequest {
  return {
    role: params.role,
    firstname: params.firstName,
    lastname: params.lastName,
    primaryemail: params.primaryEmail,
    ...(params.secondaryEmail !== undefined &&
      params.secondaryEmail !== '' && { secondaryemail: params.secondaryEmail }),
    primarynumber: params.primaryNumber,
    ...(params.secondaryNumber !== undefined &&
      params.secondaryNumber !== '' && { secondarynumber: params.secondaryNumber }),
  }
}

const TEST_CREDS = [
  {
    email: 'test@test.com',
    password: 'Test@123',
    role: 'business_user' as const,
    name: 'Test User',
    id: 'test-user',
  },
  {
    email: 'superadmin@test.com',
    password: 'Test@123',
    role: 'super_user' as const,
    name: 'Super Admin',
    id: 'test-superadmin',
  },
  {
    email: 'stateadmin@test.com',
    password: 'Test@123',
    role: 'state_admin' as const,
    name: 'State Admin',
    id: 'test-stateadmin',
  },
]

export const authApi = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const email = payload.email.trim().toLowerCase()
    const match = TEST_CREDS.find((c) => c.email === email && c.password === payload.password)
    if (match) {
      return {
        user: {
          id: match.id,
          name: match.name,
          email: match.email,
          role: match.role,
          phoneNumber: '',
          tenantId: '',
          personId: '',
        },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      }
    }

    const response = await apiClient.post<TokenResponse>('/api/v2/auth/login', {
      email: payload.email,
      password: payload.password,
    })
    const { access_token, refresh_token, id_token, user_role, tenant_id, person_id } = response.data

    const userFromToken = extractUserFromJWT(id_token)
    if (!userFromToken) {
      throw new Error('Failed to extract user information')
    }

    const user: AuthUser = {
      ...userFromToken,
      role: user_role ?? '',
      tenantId: tenant_id ?? '',
      personId: person_id ?? '',
    }

    return {
      user,
      accessToken: access_token,
      refreshToken: refresh_token,
    }
  },

  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<TokenResponse>('/api/v2/auth/refresh', {
      refreshToken,
    })
    const { access_token, refresh_token, id_token, user_role, tenant_id, person_id } = response.data

    if (!access_token || !refresh_token || !id_token) {
      throw new Error('Invalid token response')
    }

    const userFromToken = extractUserFromJWT(id_token)
    if (!userFromToken) {
      throw new Error('Failed to extract user information')
    }

    const user: AuthUser = {
      ...userFromToken,
      role: user_role ?? '',
      tenantId: tenant_id ?? '',
      personId: person_id ?? '',
    }

    return {
      user,
      accessToken: access_token,
      refreshToken: refresh_token,
    }
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/api/v2/auth/logout', {
      refreshToken,
    })
  },

  register: async (payload: RegisterRequest): Promise<void> => {
    await apiClient.post('/api/v2/auth/register', payload)
  },

  /** Fetch user email by invite/token ID (e.g. from reset/create-password link). Mock for now. */
  getUserByInviteId: async (id: string): Promise<InviteUserResponse> => {
    await new Promise((r) => setTimeout(r, 400))
    const INVITE_MOCK: Record<string, string> = {
      'invite-123': 'test@test.com',
      'invite-456': 'stateadmin@test.com',
    }
    const email = INVITE_MOCK[id]
    if (!email) {
      throw new Error('Invalid or expired invite link.')
    }
    return { email }
  },

  /** POST /api/v2/user/set-password — set system user password. */
  createPassword: async (params: SetPasswordRequest): Promise<void> => {
    const headers: Record<string, string> = {}
    if (params.tenantCode) headers['X-Tenant-Code'] = params.tenantCode
    if (params.tenantId) headers['tenant-id'] = params.tenantId

    const body = {
      userId: params.userId,
      emailId: params.emailId,
      newPassword: params.newPassword,
      confirmPassword: params.confirmPassword,
    }

    try {
      await apiClient.post<SetPasswordResponse>('/api/v2/user/set-password', body, {
        headers: Object.keys(headers).length ? headers : undefined,
      })
    } catch (err: unknown) {
      const message =
        isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : err instanceof Error
            ? err.message
            : 'Failed to create password.'
      throw new Error(message)
    }
  },

  /** GET /api/v2/user/:userId — fetch user profile for pre-fill. */
  getUserProfile: async (
    userId: string,
    options?: { tenantCode?: string; tenantId?: string }
  ): Promise<UserProfileResponse> => {
    const headers: Record<string, string> = {}
    if (options?.tenantCode) headers['X-Tenant-Code'] = options.tenantCode
    if (options?.tenantId) headers['tenant-id'] = options.tenantId

    try {
      const { data } = await apiClient.get<UserProfileResponse>(`/api/v2/user/${userId}`, {
        headers: Object.keys(headers).length ? headers : undefined,
      })
      return data
    } catch (err: unknown) {
      const message =
        isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : err instanceof Error
            ? err.message
            : 'Failed to load profile.'
      throw new Error(message)
    }
  },

  /** PUT /api/v2/user/:userId — update profile after password reset. */
  updateProfile: async (
    userId: string,
    body: UpdateProfileRequest,
    options?: { tenantCode?: string; tenantId?: string }
  ): Promise<void> => {
    const headers: Record<string, string> = {}
    if (options?.tenantCode) headers['X-Tenant-Code'] = options.tenantCode
    if (options?.tenantId) headers['tenant-id'] = options.tenantId

    try {
      await apiClient.put<UpdateProfileResponse>(`/api/v2/user/${userId}`, body, {
        headers: Object.keys(headers).length ? headers : undefined,
      })
    } catch (err: unknown) {
      const message =
        isAxiosError(err) && typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : err instanceof Error
            ? err.message
            : 'Failed to update profile.'
      throw new Error(message)
    }
  },
}
