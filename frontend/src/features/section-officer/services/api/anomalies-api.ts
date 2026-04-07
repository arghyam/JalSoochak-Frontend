import { apiClient } from '@/shared/lib/axios'
import type {
  AnomaliesListResponse,
  StatusOptionsResponse,
} from '../../types/anomalies-escalations'

export interface GetAnomaliesParams {
  userId: string
  tenantId: string
  page: number
  limit: number
  schemeName?: string
  status?: string
  startDate?: string
  endDate?: string
}

export const anomaliesApi = {
  getAnomaliesList: async (params: GetAnomaliesParams): Promise<AnomaliesListResponse> => {
    const { userId, tenantId, page, limit, schemeName, status, startDate, endDate } = params
    const response = await apiClient.get<AnomaliesListResponse>('/api/v1/analytics/anomalies', {
      params: {
        user_id: userId,
        tenant_id: tenantId,
        page_number: page,
        limit,
        ...(schemeName ? { scheme_name: schemeName } : {}),
        ...(status ? { status } : {}),
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      },
    })
    return response.data
  },

  getAnomalyStatuses: async (): Promise<StatusOptionsResponse> => {
    const response = await apiClient.get<StatusOptionsResponse>(
      '/api/v1/analytics/anomalies/statuses'
    )
    return response.data
  },
}
