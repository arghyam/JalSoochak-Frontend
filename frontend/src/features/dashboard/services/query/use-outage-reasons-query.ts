import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { OutageReasonsQueryParams, OutageReasonsResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseOutageReasonsQueryOptions = {
  params: OutageReasonsQueryParams | null
  enabled?: boolean
}

export function useOutageReasonsQuery(options: UseOutageReasonsQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<OutageReasonsResponse>({
    queryKey: dashboardQueryKeys.outageReasons(params),
    queryFn: () => {
      if (!params) {
        throw new Error('outage reasons params are required')
      }

      return dashboardApi.getOutageReasons(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
