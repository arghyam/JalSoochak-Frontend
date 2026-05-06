import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { ContinuousSchemesQueryParams, ContinuousSchemesResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseContinuousSchemesQueryOptions = {
  params: ContinuousSchemesQueryParams | null
  enabled?: boolean
}

export function useContinuousSchemesQuery(options: UseContinuousSchemesQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<ContinuousSchemesResponse>({
    queryKey: dashboardQueryKeys.continuousSchemes(params),
    queryFn: () => {
      if (!params) {
        throw new Error('continuous schemes params are required')
      }

      return dashboardApi.getContinuousSchemes(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
