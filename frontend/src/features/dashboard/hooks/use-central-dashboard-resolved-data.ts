import type {
  DashboardData,
  NationalDashboardResponse,
  OutageReasonsResponse,
  PumpOperatorPerformanceData,
  ReadingSubmissionStatusData,
  SupplyOutageTrendData,
} from '../types'
import {
  sortOutageDistributionByTotalDescending,
  toOutageDistributionData,
  toOutageReasonsData,
} from '../utils/central-dashboard-helpers'
import { mapOutageReasonsFromNationalDashboard } from '../utils/formulas'
import type { SchemeStatusChartData } from '../utils/formulas'

type BuildCentralDashboardResolvedDataParams = {
  dashboardData: DashboardData
  filteredNationalDashboardData?: NationalDashboardResponse
  isCentralLandingView: boolean
  operatorsPerformanceAnalyticsTable: PumpOperatorPerformanceData[]
  outageReasonsData?: OutageReasonsResponse
  outageReasonsTimeTrendData: SupplyOutageTrendData[]
  readingSubmissionStatusData: ReadingSubmissionStatusData[]
  schemeStatusData: SchemeStatusChartData
  shouldFetchSchemePerformanceAnalytics: boolean
}

export function buildCentralDashboardResolvedData({
  dashboardData,
  filteredNationalDashboardData,
  isCentralLandingView,
  operatorsPerformanceAnalyticsTable,
  outageReasonsData,
  outageReasonsTimeTrendData,
  readingSubmissionStatusData,
  schemeStatusData,
  shouldFetchSchemePerformanceAnalytics,
}: BuildCentralDashboardResolvedDataParams) {
  const apiWaterSupplyOutageReasonsData = outageReasonsData?.outageReasonSchemeCount
    ? [toOutageReasonsData(outageReasonsData.outageReasonSchemeCount)]
    : null
  const nationalWaterSupplyOutageReasonsData = isCentralLandingView
    ? mapOutageReasonsFromNationalDashboard(filteredNationalDashboardData, [])
    : null
  const apiWaterSupplyOutageDistributionData = outageReasonsData?.childRegions?.length
    ? toOutageDistributionData(outageReasonsData.childRegions)
    : null
  const waterSupplyOutagesData =
    nationalWaterSupplyOutageReasonsData ?? apiWaterSupplyOutageReasonsData ?? []
  const waterSupplyOutageDistributionData = sortOutageDistributionByTotalDescending(
    apiWaterSupplyOutageDistributionData ?? []
  )
  const resolvedSupplyOutageTrend =
    outageReasonsTimeTrendData.length > 0
      ? outageReasonsTimeTrendData
      : dashboardData.supplyOutageTrend
  const resolvedReadingCompliance = dashboardData.readingCompliance
  const resolvedSchemeWorkStatusCounts = shouldFetchSchemePerformanceAnalytics
    ? schemeStatusData.workStatusCounts
    : dashboardData.schemeWorkStatusCounts
  const resolvedSchemeOperatingStatusCounts = shouldFetchSchemePerformanceAnalytics
    ? schemeStatusData.operatingStatusCounts
    : dashboardData.schemeOperatingStatusCounts
  const resolvedDashboardData =
    readingSubmissionStatusData === dashboardData.readingSubmissionStatus &&
    resolvedSchemeWorkStatusCounts === dashboardData.schemeWorkStatusCounts &&
    resolvedSchemeOperatingStatusCounts === dashboardData.schemeOperatingStatusCounts &&
    resolvedSupplyOutageTrend === dashboardData.supplyOutageTrend &&
    resolvedReadingCompliance === dashboardData.readingCompliance
      ? dashboardData
      : {
          ...dashboardData,
          readingSubmissionStatus: readingSubmissionStatusData,
          readingCompliance: resolvedReadingCompliance,
          schemeWorkStatusCounts: resolvedSchemeWorkStatusCounts,
          schemeOperatingStatusCounts: resolvedSchemeOperatingStatusCounts,
          supplyOutageTrend: resolvedSupplyOutageTrend,
        }

  // Both bucket lists sum to totalCount by contract, so the readout must come from one number —
  // not a reduce over whichever dimension happens to be selected, which would flicker to zero
  // whenever the user toggles to a dimension that is legitimately empty.
  const pumpOperatorsTotal = shouldFetchSchemePerformanceAnalytics
    ? schemeStatusData.totalCount
    : resolvedDashboardData.pumpOperators.reduce((total, item) => total + item.value, 0)
  const leadingPumpOperators = dashboardData.leadingPumpOperators ?? []
  const bottomPumpOperators = dashboardData.bottomPumpOperators ?? []
  const operatorsPerformanceTable = shouldFetchSchemePerformanceAnalytics
    ? operatorsPerformanceAnalyticsTable
    : [...leadingPumpOperators, ...bottomPumpOperators]
  const villagePhotoEvidenceRows = dashboardData.readingCompliance ?? []

  return {
    operatorsPerformanceTable,
    pumpOperatorsTotal,
    resolvedDashboardData,
    villagePhotoEvidenceRows,
    waterSupplyOutageDistributionData,
    waterSupplyOutagesData,
  }
}
