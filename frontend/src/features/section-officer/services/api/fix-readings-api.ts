import { apiClient } from '@/shared/lib/axios'
import type {
  YesterdayFinalReadingResponse,
  UpdateFinalReadingPayload,
} from '../../types/fix-readings'

export const fixReadingsApi = {
  searchSchemes: async (
    schemeName: string,
    tenantCode: string
  ): Promise<YesterdayFinalReadingResponse> => {
    const response = await apiClient.get<YesterdayFinalReadingResponse>(
      '/api/v1/scheme/schemes/yesterday-final-readings',
      { params: { schemeName, tenantCode } }
    )
    return response.data
  },

  updateFinalReading: async (
    schemeId: number,
    payload: UpdateFinalReadingPayload,
    tenantCode: string
  ): Promise<void> => {
    await apiClient.patch(
      `/api/v1/telemetry/schemes/${schemeId}/yesterday-final-reading`,
      payload,
      { headers: { 'X-Tenant-Code': tenantCode } }
    )
  },
}
