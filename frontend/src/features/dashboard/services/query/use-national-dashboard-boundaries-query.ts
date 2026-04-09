import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { NationalDashboardBoundaryResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseNationalDashboardBoundariesQueryOptions = {
  enabled?: boolean
}

export function useNationalDashboardBoundariesQuery(
  options: UseNationalDashboardBoundariesQueryOptions = {}
) {
  const { enabled = true } = options

  return useQuery<NationalDashboardBoundaryResponse>({
    queryKey: dashboardQueryKeys.nationalDashboardBoundaries(),
    queryFn: () => dashboardApi.getNationalDashboardBoundaries(),
    enabled,
    retry: false,
  })
}
