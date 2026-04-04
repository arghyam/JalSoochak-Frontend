import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { TenantPublicConfig } from '../api/dashboard-api'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseTenantPublicConfigQueryOptions = {
  tenantId?: number
  enabled?: boolean
}

export function useTenantPublicConfigQuery(options: UseTenantPublicConfigQueryOptions) {
  const { tenantId, enabled = true } = options

  return useQuery<TenantPublicConfig>({
    queryKey: dashboardQueryKeys.tenantPublicConfig(tenantId),
    queryFn: () => dashboardApi.getTenantPublicConfig(tenantId as number),
    enabled: enabled && typeof tenantId === 'number',
  })
}
