import { useQuery } from '@tanstack/react-query'
import type { TenantListResponse } from '../../types'
import { dashboardApi } from '../api/dashboard-api'
import { locationSearchQueryKeys } from './location-search-query-keys'

export function useTenantsQuery(enabled = true, params?: { page?: number; size?: number }) {
  return useQuery<TenantListResponse>({
    queryKey: locationSearchQueryKeys.tenants(),
    queryFn: () => dashboardApi.getTenants(params),
    enabled,
  })
}
