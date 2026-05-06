import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { CriticalSchemesQueryParams, CriticalSchemesResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseCriticalSchemesQueryOptions = {
  params: CriticalSchemesQueryParams | null
  enabled?: boolean
}

export function useCriticalSchemesQuery(options: UseCriticalSchemesQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<CriticalSchemesResponse>({
    queryKey: dashboardQueryKeys.criticalSchemes(params),
    queryFn: () => {
      if (!params) {
        throw new Error('critical schemes params are required')
      }

      return dashboardApi.getCriticalSchemes(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
