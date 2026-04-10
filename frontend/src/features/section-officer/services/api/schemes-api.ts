import { apiClient } from '@/shared/lib/axios'
import type {
  SchemesListResponse,
  SchemeDetails,
  SchemeReadingsResponse,
} from '../../types/schemes'

type ApiEnvelope<T> = { data: T }

export function formatTimestamp(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
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
