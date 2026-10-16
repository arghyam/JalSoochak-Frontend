import axios from 'axios'
import { apiClient } from '@/shared/lib/axios'
import type {
  YesterdayFinalReadingResponse,
  UpdateFinalReadingPayload,
  UpdateFinalReadingResponse,
  UpdateFinalReadingErrorKind,
} from '../../types/fix-readings'

export class UpdateFinalReadingError extends Error {
  readonly kind: UpdateFinalReadingErrorKind

  constructor(kind: UpdateFinalReadingErrorKind, message: string) {
    super(message)
    this.name = 'UpdateFinalReadingError'
    this.kind = kind
  }
}

function toUpdateFinalReadingError(err: unknown): UpdateFinalReadingError {
  if (err instanceof UpdateFinalReadingError) return err
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    if (status === 401) return new UpdateFinalReadingError('unauthorized', err.message)
    if (status === 403) return new UpdateFinalReadingError('forbidden', err.message)
    const message = (err.response?.data as Partial<UpdateFinalReadingResponse> | undefined)?.message
    if (message) return new UpdateFinalReadingError('rejected', message)
  }
  const message = err instanceof Error ? err.message : String(err)
  return new UpdateFinalReadingError('unknown', message)
}

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

  // Tenant is resolved server-side from the officer's bearer token (attached by apiClient).
  updateFinalReading: async (
    schemeId: number,
    payload: UpdateFinalReadingPayload
  ): Promise<UpdateFinalReadingResponse> => {
    try {
      const response = await apiClient.patch<UpdateFinalReadingResponse>(
        `/api/v1/telemetry/staff/schemes/${schemeId}/yesterday-final-reading`,
        payload
      )
      if (!response.data.success) {
        throw new UpdateFinalReadingError('rejected', response.data.message)
      }
      return response.data
    } catch (err) {
      throw toUpdateFinalReadingError(err)
    }
  },
}
