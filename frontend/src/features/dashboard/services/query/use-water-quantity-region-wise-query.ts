import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type {
  WaterQuantityRegionWiseQueryParams,
  WaterQuantityRegionWiseResponse,
} from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseWaterQuantityRegionWiseQueryOptions = {
  params: WaterQuantityRegionWiseQueryParams | null
  enabled?: boolean
}

export function useWaterQuantityRegionWiseQuery(options: UseWaterQuantityRegionWiseQueryOptions) {
  const { params, enabled = true } = options

  return useQuery<WaterQuantityRegionWiseResponse>({
    queryKey: dashboardQueryKeys.waterQuantityRegionWise(params),
    queryFn: () => {
      if (!params) {
        throw new Error('water quantity region-wise params are required')
      }

      return dashboardApi.getWaterQuantityRegionWise(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
