import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { TenantBoundaryGeoJsonQueryParams, TenantBoundaryGeoJsonResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseTenantBoundaryGeoJsonQueryOptions = {
  params: TenantBoundaryGeoJsonQueryParams | null
  enabled?: boolean
}

export function useTenantBoundaryGeoJsonQuery(options: UseTenantBoundaryGeoJsonQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<TenantBoundaryGeoJsonResponse>({
    queryKey: dashboardQueryKeys.tenantBoundaryGeoJson(params),
    queryFn: () => {
      if (!params) {
        throw new Error('tenant boundary geojson params are required')
      }

      return dashboardApi.getTenantBoundaryGeoJson(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
