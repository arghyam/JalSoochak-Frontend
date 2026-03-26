import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { OutageReasonsPeriodicQueryParams, OutageReasonsPeriodicResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseOutageReasonsPeriodicQueryOptions = {
  params: OutageReasonsPeriodicQueryParams | null
  enabled?: boolean
}

export function useOutageReasonsPeriodicQuery(options: UseOutageReasonsPeriodicQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<OutageReasonsPeriodicResponse>({
    queryKey: dashboardQueryKeys.outageReasonsPeriodic(params),
    queryFn: () => {
      if (!params) {
        throw new Error('outage reasons periodic params are required')
      }

      return dashboardApi.getOutageReasonsPeriodic(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
