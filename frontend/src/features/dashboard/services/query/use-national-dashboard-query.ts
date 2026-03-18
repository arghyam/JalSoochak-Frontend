import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { NationalDashboardQueryParams, NationalDashboardResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseNationalDashboardQueryOptions = {
  params: NationalDashboardQueryParams | null
  enabled?: boolean
}

export function useNationalDashboardQuery(options: UseNationalDashboardQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<NationalDashboardResponse>({
    queryKey: dashboardQueryKeys.nationalDashboard(params),
    queryFn: () => {
      if (!params) {
        throw new Error('national dashboard params are required')
      }

      return dashboardApi.getNationalDashboard(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
