import { isAxiosError } from 'axios'
import apiClient from '@/shared/lib/axios'
import { parseJWT } from '@/shared/utils/jwt'

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
  expires_in: number
  token_type: string
  person_id: number
  user_role: string
  phone_number: string
  tenant_id?: string
  tenant_code?: string
}

interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  phoneNumber: string
  tenantId: string
  tenantCode: string
  personId: string
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
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

/** Request body for POST /api/v2/user/:userId/change-password. */
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
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

/** Response for GET /api/v1/users/me */
export interface MyProfileResponse {
  id: number
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  role: string
  tenantCode: string
  active: boolean
  createdAt: string
}

/** Request body for PATCH /api/v1/users/me */
export interface UpdateMyProfileRequest {
  firstName?: string
  lastName?: string
  phoneNumber?: string
}

/** Request body for PATCH /api/v1/users/me/password */
export interface ChangeMyPasswordRequest {
  currentPassword: string
  newPassword: string
}

/** Request body for POST /api/v1/auth/reset-password */
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

function buildUserFromTokenResponse(tokenData: TokenResponse): AuthUser {
  const jwtPayload = parseJWT(tokenData.access_token)
  return {
    id: String(tokenData.person_id),
    name: jwtPayload?.name ?? '',
    email: jwtPayload?.email ?? '',
    role: tokenData.user_role,
    phoneNumber: tokenData.phone_number ?? '',
    tenantId: tokenData.tenant_id ?? '',
    tenantCode: tokenData.tenant_code ?? '',
    personId: String(tokenData.person_id),
  }
}

export const authApi = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>('/api/v1/auth/login', {
      email: payload.email,
      password: payload.password,
    })
    const tokenData = response.data.data
    if (!tokenData.access_token) {
      throw new Error('Invalid login response')
    }
    return {
      user: buildUserFromTokenResponse(tokenData),
      accessToken: tokenData.access_token,
    }
  },

  refresh: async (): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>('/api/v1/auth/refresh')
    const tokenData = response.data.data
    if (!tokenData.access_token) {
      throw new Error('Invalid token response')
    }
    return {
      user: buildUserFromTokenResponse(tokenData),
      accessToken: tokenData.access_token,
    }
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/v1/auth/logout')
  },

  register: async (payload: RegisterRequest): Promise<void> => {
    await apiClient.post('/api/v1/auth/register', payload)
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

  /** POST /api/v2/user/:userId/change-password — change logged-in user's password. */
  changePassword: async (userId: string, payload: ChangePasswordRequest): Promise<void> => {
    try {
      await apiClient.post(`/api/v2/user/${userId}/change-password`, payload)
    } catch (err: unknown) {
      let message = 'Failed to update password.'
      if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
        message = err.response.data.message
      } else if (err instanceof Error) {
        message = err.message
      }
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

  /** GET /api/v1/auth/invite/info?token=... — fetch invite metadata from token. */
  getInviteInfo: async (
    token: string
  ): Promise<{
    email: string
    role: string
    tenantName: string
    firstName: string
    lastName: string
    phoneNumber: string
  }> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          email: string
          role: string
          tenantName: string
          firstName: string
          lastName: string
          phoneNumber: string
        }>
      >('/api/v1/auth/invite/info', { params: { token } })
      return response.data.data
    } catch (err: unknown) {
      let message = 'Invalid or expired invite link.'
      if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
        message = err.response.data.message
      } else if (err instanceof Error) {
        message = err.message
      }
      throw new Error(message)
    }
  },

  /** GET /api/v1/users/me — fetch logged-in user's profile. */
  getMyProfile: async (): Promise<MyProfileResponse> => {
    try {
      const { data } = await apiClient.get<ApiResponse<MyProfileResponse>>('/api/v1/users/me')
      return data.data
    } catch (err: unknown) {
      let message = 'Failed to load profile.'
      if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
        message = err.response.data.message
      } else if (err instanceof Error) {
        message = err.message
      }
      throw new Error(message)
    }
  },

  /** PATCH /api/v1/users/me — update logged-in user's profile. */
  updateMyProfile: async (payload: UpdateMyProfileRequest): Promise<MyProfileResponse> => {
    try {
      const { data } = await apiClient.patch<ApiResponse<MyProfileResponse>>(
        '/api/v1/users/me',
        payload
      )
      return data.data
    } catch (err: unknown) {
      let message = 'Failed to update profile.'
      if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
        message = err.response.data.message
      } else if (err instanceof Error) {
        message = err.message
      }
      throw new Error(message)
    }
  },

  /** PATCH /api/v1/users/me/password — change logged-in user's password. */
  changeMyPassword: async (payload: ChangeMyPasswordRequest): Promise<void> => {
    try {
      await apiClient.patch('/api/v1/users/me/password', payload)
    } catch (err: unknown) {
      let message = 'Failed to update password.'
      if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
        message = err.response.data.message
      } else if (err instanceof Error) {
        message = err.message
      }
      throw new Error(message)
    }
  },

  /** POST /api/v1/auth/activate-account — set password + profile for invited user. Returns session. */
  activateAccount: async (payload: {
    inviteToken: string
    firstName: string
    lastName: string
    phoneNumber: string
    password: string
  }): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<TokenResponse>>(
        '/api/v1/auth/activate-account',
        payload
      )
      const tokenData = response.data.data
      if (!tokenData?.access_token) {
        throw new Error('Invalid activation response')
      }
      return {
        user: buildUserFromTokenResponse(tokenData),
        accessToken: tokenData.access_token,
      }
    } catch (err: unknown) {
      let message = 'Failed to activate account.'
      if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
        message = err.response.data.message
      } else if (err instanceof Error) {
        message = err.message
      }
      throw new Error(message)
    }
  },

  /** POST /api/v1/auth/forgot-password — send reset link to email. */
  forgotPassword: async (email: string): Promise<void> => {
    try {
      await apiClient.post('/api/v1/auth/forgot-password', { email })
    } catch (err: unknown) {
      let message = 'Failed to send reset link.'
      if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
        message = err.response.data.message
      } else if (err instanceof Error) {
        message = err.message
      }
      throw new Error(message)
    }
  },

  /** POST /api/v1/auth/reset-password — reset password using token from email link. */
  resetPassword: async (payload: ResetPasswordRequest): Promise<void> => {
    try {
      await apiClient.post('/api/v1/auth/reset-password', payload)
    } catch (err: unknown) {
      let message = 'Failed to reset password.'
      if (isAxiosError(err) && typeof err.response?.data?.message === 'string') {
        message = err.response.data.message
      } else if (err instanceof Error) {
        message = err.message
      }
      throw new Error(message)
    }
  },
}
