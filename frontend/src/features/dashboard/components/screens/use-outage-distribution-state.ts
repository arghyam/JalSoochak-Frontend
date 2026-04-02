import { useMemo } from 'react'
import type { WaterSupplyOutageData } from '../../types'
import type { MonthlyTrendPoint } from '../charts/monthly-trend-chart'
import { hasRenderableSupplyOutageReasons } from '../../utils/supply-outage'

export type OutageDistributionViewBy = 'geography' | 'time'

type UseOutageDistributionStateParams = {
  waterSupplyOutagesData: WaterSupplyOutageData[]
  outageDistributionViewBy: OutageDistributionViewBy
  waterSupplyOutageDistributionData: WaterSupplyOutageData[]
  outageDistributionTimeTrendData: MonthlyTrendPoint[]
}

export function useOutageDistributionState({
  waterSupplyOutagesData,
  outageDistributionViewBy,
  waterSupplyOutageDistributionData,
  outageDistributionTimeTrendData,
}: UseOutageDistributionStateParams) {
  const hasOutageReasonsData = useMemo(
    () => hasRenderableSupplyOutageReasons(waterSupplyOutagesData),
    [waterSupplyOutagesData]
  )

  const hasGeographyData = waterSupplyOutageDistributionData.length > 0
  const hasTimeTrendData = outageDistributionTimeTrendData.length > 0

  const isOutageDistributionSelectDisabled =
    !hasOutageReasonsData ||
    (outageDistributionViewBy === 'geography' ? !hasGeographyData : !hasTimeTrendData)

  return {
    hasOutageReasonsData,
    hasGeographyData,
    hasTimeTrendData,
    isOutageDistributionSelectDisabled,
  }
}
