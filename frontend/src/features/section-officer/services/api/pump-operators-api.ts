import { apiClient } from '@/shared/lib/axios'
import type {
  PumpOperatorsListResponse,
  PumpOperatorDetails,
  PumpOperatorReadingsResponse,
  OperatorAttendanceRecord,
} from '../../types/pump-operators'

type ApiEnvelope<T> = { data: T }

export interface GetPumpOperatorsListParams {
  personId: string
  tenantCode: string
  page: number
  size: number
  name?: string
  status?: string
  startDate?: string
  endDate?: string
}

export interface GetPumpOperatorDetailsParams {
  operatorId: string
  tenantCode: string
}

export interface GetPumpOperatorReadingsParams {
  operatorId: string
  tenantCode: string
  page: number
  size: number
  schemeName?: string
}

export interface GetOperatorAttendanceParams {
  uuid: string
  startDate: string
  endDate: string
}

export const pumpOperatorsApi = {
  getPumpOperatorsList: async (
    params: GetPumpOperatorsListParams
  ): Promise<PumpOperatorsListResponse> => {
    const { personId, tenantCode, page, size, name, status, startDate, endDate } = params
    const response = await apiClient.get<ApiEnvelope<PumpOperatorsListResponse>>(
      `/api/v1/pumpoperator/person/${personId}/pump-operators`,
      {
        params: {
          tenantCode,
          page,
          size,
          ...(name ? { name } : {}),
          ...(status ? { status } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      }
    )
    return response.data.data
  },

  getPumpOperatorDetails: async (
    params: GetPumpOperatorDetailsParams
  ): Promise<PumpOperatorDetails> => {
    const { operatorId, tenantCode } = params
    const response = await apiClient.get<ApiEnvelope<PumpOperatorDetails>>(
      `/api/v1/pumpoperator/pump-operators/${operatorId}`,
      { params: { tenantCode } }
    )
    return response.data.data
  },

  getPumpOperatorReadings: async (
    params: GetPumpOperatorReadingsParams
  ): Promise<PumpOperatorReadingsResponse> => {
    const { operatorId, tenantCode, page, size, schemeName } = params
    const response = await apiClient.get<ApiEnvelope<PumpOperatorReadingsResponse>>(
      `/api/v1/pumpoperator/pump-operators/${operatorId}/readings`,
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

  getOperatorAttendance: async (
    params: GetOperatorAttendanceParams
  ): Promise<OperatorAttendanceRecord[]> => {
    const { uuid, startDate, endDate } = params
    const response = await apiClient.get<ApiEnvelope<OperatorAttendanceRecord[]>>(
      '/api/v1/analytics/operator-attendance',
      {
        params: {
          uuid,
          start_date: startDate,
          end_date: endDate,
        },
      }
    )
    return response.data.data
  },
}
