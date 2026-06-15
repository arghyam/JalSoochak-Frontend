import { publicApiClient } from '@/shared/lib/axios'
import type {
  PumpOperatorDetailsQueryParams,
  PumpOperatorDetailsResponse,
  PumpOperatorsBySchemeQueryParams,
  PumpOperatorsBySchemeResponse,
  ReadingComplianceQueryParams,
  ReadingComplianceResponse,
} from '../../types'
import {
  type RawPumpOperatorDetailsResponse,
  normalizeMissedSubmissionDays,
} from './normalizers/dashboard-api-normalizers'

export const pumpOperatorApi = {
  getPumpOperatorDetails: async (
    params: PumpOperatorDetailsQueryParams
  ): Promise<PumpOperatorDetailsResponse> => {
    const response = await publicApiClient.get<RawPumpOperatorDetailsResponse>(
      `/api/v1/pumpoperator/pump-operators/${params.pumpOperatorId}`,
      {
        params: {
          tenantCode: params.tenant_code,
          schemeId: params.scheme_id,
          startDate: params.startDate,
          endDate: params.endDate,
        },
      }
    )

    return {
      ...response.data,
      data: {
        ...response.data.data,
        missedSubmissionDays: normalizeMissedSubmissionDays(
          response.data.data.missedSubmissionDays
        ),
      },
    }
  },
  getPumpOperatorsByScheme: async (
    params: PumpOperatorsBySchemeQueryParams
  ): Promise<PumpOperatorsBySchemeResponse> => {
    const response = await publicApiClient.get<PumpOperatorsBySchemeResponse>(
      '/api/v1/pumpoperator/pump-operators/by-scheme',
      {
        params: {
          tenantCode: params.tenant_code,
          schemeId: params.scheme_id,
        },
      }
    )

    return response.data
  },
  getReadingCompliance: async (
    params: ReadingComplianceQueryParams
  ): Promise<ReadingComplianceResponse> => {
    const endpoint =
      params.scheme_id != null
        ? '/api/v1/pumpoperator/pump-operators/by-scheme/reading-compliance'
        : '/api/v1/pumpoperator/pump-operators/reading-compliance'

    const response = await publicApiClient.get<ReadingComplianceResponse>(endpoint, {
      params: {
        tenantCode: params.tenant_code,
        schemeId: params.scheme_id,
        pumpOperatorId: params.pump_operator_id,
        startDate: params.startDate,
        endDate: params.endDate,
        page: params.page ?? 0,
        size: params.size ?? 50,
      },
    })

    return response.data
  },
}
