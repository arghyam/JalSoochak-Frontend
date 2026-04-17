import { apiClient } from '@/shared/lib/axios'
import type {
  SchemesListResponse,
  SchemeDetails,
  SchemeReadingsResponse,
} from '../../types/schemes'

type ApiEnvelope<T> = { data: T }

export function formatTimestamp(iso: string): string {
  if (!iso) return '—'

  // Parse ISO string. If no timezone info, assume GMT (as per API contract)
  let date: Date
  try {
    // Ensure timezone-aware parsing: append 'Z' if not present
    const hasTimezone = /Z|[+-]\d{2}:\d{2}/.exec(iso)
    const isoString = iso.includes('T') && !hasTimezone ? `${iso}Z` : iso
    date = new Date(isoString)
  } catch {
    return '—'
  }

  if (Number.isNaN(date.getTime())) return '—'

  // Convert UTC to IST (UTC+5:30)
  const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000)

  const dd = String(istDate.getUTCDate()).padStart(2, '0')
  const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = istDate.getUTCFullYear()
  const hh = String(istDate.getUTCHours()).padStart(2, '0')
  const min = String(istDate.getUTCMinutes()).padStart(2, '0')
  return `${dd}-${mm}-${yyyy}, ${hh}:${min}`
}

export interface GetSchemesListParams {
  personId: string
  tenantCode: string
  page: number
  size: number
  schemeName?: string
}

export interface GetSchemeDetailsParams {
  schemeId: string
  tenantCode: string
}

export interface GetSchemeReadingsParams {
  schemeId: string
  tenantCode: string
  page: number
  size: number
}

export const schemesApi = {
  getSchemesList: async (params: GetSchemesListParams): Promise<SchemesListResponse> => {
    const { personId, tenantCode, page, size, schemeName } = params
    const response = await apiClient.get<ApiEnvelope<SchemesListResponse>>(
      `/api/v1/pumpoperator/person/${personId}/schemes`,
      {
        params: {
          tenantCode,
          page,
          size,
          ...(schemeName ? { schemeName } : {}),
        },
      }
    )
    return response.data.data
  },

  getSchemeDetails: async (params: GetSchemeDetailsParams): Promise<SchemeDetails> => {
    const { schemeId, tenantCode } = params
    const response = await apiClient.get<ApiEnvelope<SchemeDetails>>(
      `/api/v1/pumpoperator/schemes/${schemeId}/details`,
      { params: { tenantCode } }
    )
    return response.data.data
  },

  getSchemeReadings: async (params: GetSchemeReadingsParams): Promise<SchemeReadingsResponse> => {
    const { schemeId, tenantCode, page, size } = params
    const response = await apiClient.get<ApiEnvelope<SchemeReadingsResponse>>(
      `/api/v1/pumpoperator/schemes/${schemeId}/reading-submissions`,
      { params: { tenantCode, page, size } }
    )
    return response.data.data
  },
}
