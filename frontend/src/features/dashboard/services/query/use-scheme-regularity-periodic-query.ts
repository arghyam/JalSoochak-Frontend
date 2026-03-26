import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type {
  SchemeRegularityPeriodicQueryParams,
  SchemeRegularityPeriodicResponse,
} from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseSchemeRegularityPeriodicQueryOptions = {
  params: SchemeRegularityPeriodicQueryParams | null
  enabled?: boolean
}

export function useSchemeRegularityPeriodicQuery(options: UseSchemeRegularityPeriodicQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<SchemeRegularityPeriodicResponse>({
    queryKey: dashboardQueryKeys.schemeRegularityPeriodic(params),
    queryFn: () => {
      if (!params) {
        throw new Error('scheme regularity periodic params are required')
      }

      return dashboardApi.getSchemeRegularityPeriodic(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
