import axios from 'axios'
import { apiClient } from '@/shared/lib/axios'
import type {
  YesterdayFinalReadingResponse,
  UpdateFinalReadingPayload,
  UpdateFinalReadingResponse,
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
  ): Promise<UpdateFinalReadingResponse> => {
    try {
      const response = await apiClient.patch<UpdateFinalReadingResponse>(
        `/api/v1/telemetry/schemes/${schemeId}/yesterday-final-reading`,
        payload,
        { headers: { 'X-Tenant-Code': tenantCode } }
      )
      if (!response.data.success) {
        throw new Error(response.data.message)
      }
      return response.data
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = (err.response?.data as UpdateFinalReadingResponse)?.message
        throw new Error(message ?? err.message)
      }
      throw err
    }
  },
}
