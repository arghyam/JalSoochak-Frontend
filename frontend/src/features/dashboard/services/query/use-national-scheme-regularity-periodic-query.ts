import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type {
  NationalSchemeRegularityPeriodicQueryParams,
  NationalSchemeRegularityPeriodicResponse,
} from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseNationalSchemeRegularityPeriodicQueryOptions = {
  params: NationalSchemeRegularityPeriodicQueryParams | null
  enabled?: boolean
}

export function useNationalSchemeRegularityPeriodicQuery(
  options: UseNationalSchemeRegularityPeriodicQueryOptions
) {
  const { params, enabled = true } = options

  return useQuery<NationalSchemeRegularityPeriodicResponse>({
    queryKey: dashboardQueryKeys.nationalSchemeRegularityPeriodic(params),
    queryFn: () => {
      if (!params) {
        throw new Error('national scheme regularity periodic params are required')
      }

      return dashboardApi.getNationalSchemeRegularityPeriodic(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
