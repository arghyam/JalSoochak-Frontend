import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type { WaterQuantityPeriodicQueryParams, WaterQuantityPeriodicResponse } from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseWaterQuantityPeriodicQueryOptions = {
  params: WaterQuantityPeriodicQueryParams | null
  enabled?: boolean
}

export function useWaterQuantityPeriodicQuery(options: UseWaterQuantityPeriodicQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<WaterQuantityPeriodicResponse>({
    queryKey: dashboardQueryKeys.waterQuantityPeriodic(params),
    queryFn: () => {
      if (!params) {
        throw new Error('water quantity periodic params are required')
      }

      return dashboardApi.getWaterQuantityPeriodic(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
