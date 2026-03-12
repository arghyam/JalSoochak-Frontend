import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { HierarchyType, TenantChildLocationsResponse } from '../api/dashboard-api'
import { locationSearchQueryKeys } from './location-search-query-keys'

type UseLocationChildrenQueryOptions = {
  tenantId?: number
  hierarchyType: HierarchyType
  parentId?: number
  tenantCode?: string
  enabled?: boolean
}

export function useLocationChildrenQuery(options: UseLocationChildrenQueryOptions) {
  const { tenantId, hierarchyType, parentId, tenantCode, enabled = true } = options

  return useQuery<TenantChildLocationsResponse>({
    queryKey: locationSearchQueryKeys.children(tenantId, hierarchyType, parentId),
    queryFn: () => {
      if (tenantId === undefined || parentId === undefined) {
        throw new Error('tenantId and parentId are required for location children query')
      }
      return dashboardApi.getTenantChildLocations({
        tenantId,
        hierarchyType,
        parentId,
        tenantCode,
      })
    },
    enabled: enabled && tenantId !== undefined && parentId !== undefined,
  })
}
