import type {
  DashboardData,
  NationalDashboardResponse,
  OutageReasonsResponse,
  PumpOperatorPerformanceData,
  PumpOperatorsData,
  ReadingSubmissionStatusData,
  SupplyOutageTrendData,
} from '../types'
import {
  sortOutageDistributionByTotalDescending,
  toOutageDistributionData,
  toOutageReasonsData,
} from '../utils/central-dashboard-helpers'
import { mapOutageReasonsFromNationalDashboard } from '../utils/formulas'

type BuildCentralDashboardResolvedDataParams = {
  dashboardData: DashboardData
  filteredNationalDashboardData?: NationalDashboardResponse
  isCentralLandingView: boolean
  operatorsPerformanceAnalyticsTable: PumpOperatorPerformanceData[]
  outageReasonsData?: OutageReasonsResponse
  outageReasonsTimeTrendData: SupplyOutageTrendData[]
  pumpOperatorsData: PumpOperatorsData[]
  readingSubmissionStatusData: ReadingSubmissionStatusData[]
  shouldFetchSchemePerformanceAnalytics: boolean
}

export function buildCentralDashboardResolvedData({
  dashboardData,
  filteredNationalDashboardData,
  isCentralLandingView,
  operatorsPerformanceAnalyticsTable,
  outageReasonsData,
  outageReasonsTimeTrendData,
  pumpOperatorsData,
  readingSubmissionStatusData,
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
  const resolvedDashboardData =
    readingSubmissionStatusData === dashboardData.readingSubmissionStatus &&
    pumpOperatorsData === dashboardData.pumpOperators &&
    resolvedSupplyOutageTrend === dashboardData.supplyOutageTrend &&
    resolvedReadingCompliance === dashboardData.readingCompliance
      ? dashboardData
      : {
          ...dashboardData,
          readingSubmissionStatus: readingSubmissionStatusData,
          readingCompliance: resolvedReadingCompliance,
          pumpOperators: pumpOperatorsData,
          supplyOutageTrend: resolvedSupplyOutageTrend,
        }

  const pumpOperatorsTotal = resolvedDashboardData.pumpOperators.reduce(
    (total, item) => total + item.value,
    0
  )
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
