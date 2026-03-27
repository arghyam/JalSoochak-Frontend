import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type {
  AverageSchemeRegularityQueryParams,
  AverageSchemeRegularityResponse,
} from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseAverageSchemeRegularityQueryOptions = {
  params: AverageSchemeRegularityQueryParams | null
  enabled?: boolean
}

export function useAverageSchemeRegularityQuery(options: UseAverageSchemeRegularityQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<AverageSchemeRegularityResponse>({
    queryKey: dashboardQueryKeys.averageSchemeRegularity(params),
    queryFn: () => {
      if (!params) {
        throw new Error('average scheme regularity params are required')
      }

      return dashboardApi.getAverageSchemeRegularity(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
