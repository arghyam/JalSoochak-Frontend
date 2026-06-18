import { useMutation, useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type {
  SchemePerformanceDownloadParams,
  SchemePerformanceQueryParams,
  SchemePerformanceResponse,
} from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseSchemePerformanceQueryOptions = {
  params: SchemePerformanceQueryParams | null
  enabled?: boolean
}

export function useSchemePerformanceQuery(options: UseSchemePerformanceQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<SchemePerformanceResponse>({
    queryKey: dashboardQueryKeys.schemePerformance(params),
    queryFn: () => {
      if (!params) {
        throw new Error('scheme performance params are required')
      }

      return dashboardApi.getSchemePerformance(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
    placeholderData: (previousData) => previousData,
  })
}

export function useSchemePerformanceDownloadMutation() {
  return useMutation({
    mutationFn: (params: SchemePerformanceDownloadParams) =>
      dashboardApi.downloadSchemePerformance(params),
  })
}
