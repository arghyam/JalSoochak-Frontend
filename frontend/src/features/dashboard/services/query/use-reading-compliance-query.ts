import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { ReadingComplianceQueryParams, ReadingComplianceResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseReadingComplianceQueryOptions = {
  params: ReadingComplianceQueryParams | null
  enabled?: boolean
}

export function useReadingComplianceQuery(options: UseReadingComplianceQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<ReadingComplianceResponse>({
    queryKey: dashboardQueryKeys.readingCompliance(params),
    queryFn: () => {
      if (!params) {
        throw new Error('reading compliance params are required')
      }

      return dashboardApi.getReadingCompliance(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
