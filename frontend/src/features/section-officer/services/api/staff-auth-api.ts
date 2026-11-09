import { isAxiosError } from 'axios'
import apiClient from '@/shared/lib/axios'
import type { AuthUser, LoginResponse } from '@/features/auth/services/auth-api'
import type {
  OtpRequestPayload,
  OtpRequestResponse,
  OtpVerifyPayload,
  PublicTenant,
  RequestOtpErrorKind,
} from '@/features/section-officer/types/staff-auth'

export class RequestOtpError extends Error {
  readonly kind: RequestOtpErrorKind

  constructor(kind: RequestOtpErrorKind, message: string) {
    super(message)
    this.name = 'RequestOtpError'
    this.kind = kind
  }
}

function toRequestOtpError(err: unknown): RequestOtpError {
  if (err instanceof RequestOtpError) return err
  const message = err instanceof Error ? err.message : String(err)
  // The backend returns the same 404 for an unregistered phone and an unknown or inactive tenant.
  if (isAxiosError(err) && err.response?.status === 404) {
    return new RequestOtpError('accountNotFound', message)
  }
  return new RequestOtpError('unknown', message)
}

interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

interface OtpRequestApiData {
  otpLength: number
}

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  person_id: number
  user_role: string
  phone_number: string
  tenant_id?: string
  tenant_code?: string
  name?: string
}

interface TenantApiItem {
  id: number
  stateCode: string
  name: string
  status: string
}

interface TenantsListApiResponse {
  content: TenantApiItem[]
  totalElements: number
  totalPages: number
}

function buildUserFromToken(tokenData: TokenResponse): AuthUser {
  return {
    id: String(tokenData.person_id),
    name: tokenData.name ?? '',
    role: tokenData.user_role,
    phoneNumber: tokenData.phone_number ?? '',
    tenantId: tokenData.tenant_id ?? '',
    tenantCode: tokenData.tenant_code ?? '',
    personId: String(tokenData.person_id),
  }
}

export const staffAuthApi = {
  requestOtp: async (payload: OtpRequestPayload): Promise<OtpRequestResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<OtpRequestApiData>>(
        '/api/v1/auth/staff/otp',
        payload
      )
      return { otpLength: response.data.data.otpLength }
    } catch (err: unknown) {
      throw toRequestOtpError(err)
    }
  },

  verifyOtp: async (payload: OtpVerifyPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>(
      '/api/v1/auth/staff/otp/verify',
      payload
    )
    const tokenData = response.data.data
    if (!tokenData.access_token) {
      throw new Error('Invalid login response')
    }
    return {
      user: buildUserFromToken(tokenData),
      accessToken: tokenData.access_token,
    }
  },

  /** Fetches all tenants without authentication (apiClient only adds Bearer when token exists). */
  getPublicTenants: async (): Promise<PublicTenant[]> => {
    const pageSize = 100
    const firstResponse = await apiClient.get<ApiResponse<TenantsListApiResponse>>(
      '/api/v1/tenants',
      { params: { page: 0, size: pageSize } }
    )
    const firstPage = firstResponse.data.data
    const allContent = [...firstPage.content]

    if (firstPage.totalPages > 1) {
      const remainingPages = Array.from({ length: firstPage.totalPages - 1 }, (_, i) => i + 1)
      const responses = await Promise.all(
        remainingPages.map((page) =>
          apiClient.get<ApiResponse<TenantsListApiResponse>>('/api/v1/tenants', {
            params: { page, size: pageSize },
          })
        )
      )
      for (const response of responses) {
        allContent.push(...response.data.data.content)
      }
    }

    return allContent.map((t) => ({
      id: t.id,
      stateCode: t.stateCode,
      name: t.name,
      status: t.status,
    }))
  },
}
