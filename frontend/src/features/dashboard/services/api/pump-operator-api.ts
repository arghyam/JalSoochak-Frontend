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
    const response = await publicApiClient.get<ReadingComplianceResponse>(
      params.scheme_id != null
        ? '/api/v1/pumpoperator/pump-operators/by-scheme/reading-compliance'
        : '/api/v1/pumpoperator/pump-operators/reading-compliance',
      {
        params: {
          tenantCode: params.tenant_code,
          schemeId: params.scheme_id,
          page: params.page ?? 0,
          size: params.size ?? 50,
        },
      }
    )

    return response.data
  },
}
