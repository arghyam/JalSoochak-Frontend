import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { PumpOperatorsBySchemeQueryParams, PumpOperatorsBySchemeResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UsePumpOperatorsBySchemeQueryOptions = {
  params: PumpOperatorsBySchemeQueryParams | null
  enabled?: boolean
}

export function usePumpOperatorsBySchemeQuery(options: UsePumpOperatorsBySchemeQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<PumpOperatorsBySchemeResponse>({
    queryKey: dashboardQueryKeys.pumpOperatorsByScheme(params),
    queryFn: () => {
      if (!params) {
        throw new Error('pump operator by scheme params are required')
      }

      return dashboardApi.getPumpOperatorsByScheme(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
