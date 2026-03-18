import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard-api'
import type {
  AverageWaterSupplyPerRegionQueryParams,
  AverageWaterSupplyPerRegionResponse,
} from '../../types'
import { dashboardQueryKeys } from './dashboard-query-keys'

type UseAverageWaterSupplyPerRegionQueryOptions = {
  params: AverageWaterSupplyPerRegionQueryParams | null
  enabled?: boolean
}

export function useAverageWaterSupplyPerRegionQuery(
  options: UseAverageWaterSupplyPerRegionQueryOptions
) {
  const { params, enabled = true } = options

  return useQuery<AverageWaterSupplyPerRegionResponse>({
    queryKey: dashboardQueryKeys.averageWaterSupplyPerRegion(params),
    queryFn: () => {
      if (!params) {
        throw new Error('average water supply params are required')
      }

      return dashboardApi.getAverageWaterSupplyPerRegion(params)
    },
    enabled: enabled && Boolean(params),
    retry: false,
  })
}
