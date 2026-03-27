import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { HierarchyType, TenantLocationHierarchyResponse } from '../api/dashboard-api'
import { locationSearchQueryKeys } from './location-search-query-keys'

type UseLocationHierarchyQueryOptions = {
  tenantId?: number
  hierarchyType: HierarchyType
  tenantCode?: string
  enabled?: boolean
}

export function useLocationHierarchyQuery(options: UseLocationHierarchyQueryOptions) {
  const { tenantId, hierarchyType, tenantCode, enabled = true } = options

  return useQuery<TenantLocationHierarchyResponse>({
    queryKey: locationSearchQueryKeys.hierarchy(tenantId, hierarchyType),
    queryFn: () => {
      if (tenantId === undefined) {
        throw new Error('tenantId is required for location hierarchy query')
      }
      return dashboardApi.getTenantLocationHierarchy({
        tenantId,
        hierarchyType,
        tenantCode,
      })
    },
    enabled: enabled && tenantId !== undefined,
  })
}
