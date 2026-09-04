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
      `/api/v1/pumpoperator/pump-operators/by-uuid/${params.pumpOperatorUuid}`,
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
    // Scheme-scoped only. The tenant-wide /pump-operators/reading-compliance variant is
    // authenticated now — it returned every operator in the tenant a page at a time — and callers
    // here always have a scheme, so there is no unscoped branch to fall back to.
    const response = await publicApiClient.get<ReadingComplianceResponse>(
      '/api/v1/pumpoperator/pump-operators/by-scheme/reading-compliance',
      {
        params: {
          tenantCode: params.tenant_code,
          schemeId: params.scheme_id,
          startDate: params.startDate,
          endDate: params.endDate,
          page: params.page ?? 0,
          size: params.size ?? 50,
        },
      }
    )

    return response.data
  },
}
