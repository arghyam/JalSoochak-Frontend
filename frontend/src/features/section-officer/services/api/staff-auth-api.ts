import { isAxiosError } from 'axios'
import apiClient from '@/shared/lib/axios'
import type { AuthUser, LoginResponse } from '@/features/auth/services/auth-api'
import type {
  OtpRequestPayload,
  OtpRequestResponse,
  OtpVerifyPayload,
  PublicTenant,
  RequestOtpErrorKind,
  VerifyOtpErrorKind,
} from '@/features/section-officer/types/staff-auth'

export class RequestOtpError extends Error {
  readonly kind: RequestOtpErrorKind

  constructor(kind: RequestOtpErrorKind, message: string) {
    super(message)
    this.name = 'RequestOtpError'
    this.kind = kind
  }
}

export class VerifyOtpError extends Error {
  readonly kind: VerifyOtpErrorKind

  constructor(kind: VerifyOtpErrorKind, message: string) {
    super(message)
    this.name = 'VerifyOtpError'
    this.kind = kind
  }
}

const REQUEST_OTP_ERROR_KIND_BY_STATUS: Partial<Record<number, RequestOtpErrorKind>> = {
  // A system admin trying OTP login, or a failed captcha.
  400: 'rejected',
  // The same 404 for an unregistered phone and an unknown or inactive tenant.
  404: 'accountNotFound',
  // Gateway rate limit.
  429: 'tooManyAttempts',
}

const VERIFY_OTP_ERROR_KIND_BY_STATUS: Partial<Record<number, VerifyOtpErrorKind>> = {
  // Wrong or expired OTP, or the maximum number of attempts reached.
  400: 'invalidOtp',
  403: 'accountDeactivated',
  // Gateway rate limit.
  429: 'tooManyAttempts',
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function getResponseStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined
}

function toRequestOtpError(err: unknown): RequestOtpError {
  if (err instanceof RequestOtpError) return err
  const status = getResponseStatus(err)
  const kind = status === undefined ? undefined : REQUEST_OTP_ERROR_KIND_BY_STATUS[status]
  return new RequestOtpError(kind ?? 'unknown', getErrorMessage(err))
}

function toVerifyOtpError(err: unknown): VerifyOtpError {
  if (err instanceof VerifyOtpError) return err
  const status = getResponseStatus(err)
  const kind = status === undefined ? undefined : VERIFY_OTP_ERROR_KIND_BY_STATUS[status]
  return new VerifyOtpError(kind ?? 'unknown', getErrorMessage(err))
}

interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

interface OtpRequestApiData {
  otpLength?: number
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
      // The envelope omits `data` when it is null, so fall through to the caller's default length.
      const response = await apiClient.post<ApiResponse<OtpRequestApiData | undefined>>(
        '/api/v1/auth/staff/otp',
        payload
      )
      return { otpLength: response.data.data?.otpLength }
    } catch (err: unknown) {
      throw toRequestOtpError(err)
    }
  },

  verifyOtp: async (payload: OtpVerifyPayload): Promise<LoginResponse> => {
    try {
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
    } catch (err: unknown) {
      throw toVerifyOtpError(err)
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
