import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { PumpOperatorDetailsQueryParams, PumpOperatorDetailsResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UsePumpOperatorDetailsQueryOptions = {
  params: PumpOperatorDetailsQueryParams | null
  enabled?: boolean
}

export function usePumpOperatorDetailsQuery(options: UsePumpOperatorDetailsQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<PumpOperatorDetailsResponse>({
    queryKey: dashboardQueryKeys.pumpOperatorDetails(params),
    queryFn: () => {
      if (!params) {
        throw new Error('pump operator params are required')
      }

      return dashboardApi.getPumpOperatorDetails(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
