import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { TenantBoundaryQueryParams, TenantBoundaryResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseTenantBoundariesQueryOptions = {
  params: TenantBoundaryQueryParams | null
  enabled?: boolean
}

export function useTenantBoundariesQuery(options: UseTenantBoundariesQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<TenantBoundaryResponse>({
    queryKey: dashboardQueryKeys.tenantBoundaries(params),
    queryFn: () => {
      if (!params) {
        throw new Error('tenant boundary params are required')
      }

      return dashboardApi.getTenantBoundaries(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
