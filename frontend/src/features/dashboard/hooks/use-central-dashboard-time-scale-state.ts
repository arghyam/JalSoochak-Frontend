import { useState } from 'react'
import type {
  OutageTimeScaleTab,
  PerformanceTimeScaleTab,
} from '../utils/central-dashboard-helpers'

export function useCentralDashboardTimeScaleState() {
  const [quantityTimeScaleTab, setQuantityTimeScaleTab] = useState<PerformanceTimeScaleTab>('day')
  const [regularityTimeScaleTab, setRegularityTimeScaleTab] =
    useState<PerformanceTimeScaleTab>('day')
  const [outageDistributionTimeScaleTab, setOutageDistributionTimeScaleTab] =
    useState<OutageTimeScaleTab>('day')

  return {
    outageDistributionTimeScaleTab,
    quantityTimeScaleTab,
    regularityTimeScaleTab,
    setOutageDistributionTimeScaleTab,
    setQuantityTimeScaleTab,
    setRegularityTimeScaleTab,
  }
}
