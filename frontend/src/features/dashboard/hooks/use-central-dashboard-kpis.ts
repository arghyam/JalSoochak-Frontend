import {
  getRegularityKpi,
  getRegularityKpiFromNationalDashboard,
  getRegularityKpiFromPeriodic,
  getWaterSupplyKpis,
  getWaterSupplyKpisFromNationalDashboard,
  getWaterSupplyKpisFromPeriodic,
  hasWaterSupplyData,
  resolveDaysInRange,
} from '../utils/formulas'

type UseCentralDashboardKpisParams = {
  averagePersonsPerHousehold: number
  averageWaterSupplyData: Parameters<typeof getWaterSupplyKpis>[0]
  currentRegularityKpiData: Parameters<typeof getRegularityKpi>[0]
  currentWaterSupplyKpiData: Parameters<typeof hasWaterSupplyData>[0]
  filteredNationalDashboardData: Parameters<typeof getWaterSupplyKpisFromNationalDashboard>[0]
  filteredPreviousNationalDashboardData: Parameters<
    typeof getWaterSupplyKpisFromNationalDashboard
  >[0]
  isCentralLandingView: boolean
  isHierarchyLeafSelected: boolean
  nationalDefaultAverageMembersPerHousehold: number
  previousAnalyticsRange: {
    startDate: string
    endDate: string
  }
  previousRegularityKpiData: Parameters<typeof getRegularityKpi>[0]
  previousSchemeQuantityPeriodicData: Parameters<typeof getWaterSupplyKpisFromPeriodic>[0]
  previousSchemeRegularityPeriodicData: Parameters<typeof getRegularityKpiFromPeriodic>[0]
  previousWaterQuantityPeriodicData: Parameters<typeof getWaterSupplyKpisFromPeriodic>[1]
  previousWaterSupplyKpiData: Parameters<typeof getWaterSupplyKpis>[0]
  schemeRegularityPeriodicData: Parameters<typeof getWaterSupplyKpisFromPeriodic>[0]
  waterQuantityPeriodicData: Parameters<typeof getWaterSupplyKpisFromPeriodic>[1]
}

export function useCentralDashboardKpis({
  averagePersonsPerHousehold,
  averageWaterSupplyData,
  currentRegularityKpiData,
  currentWaterSupplyKpiData,
  filteredNationalDashboardData,
  filteredPreviousNationalDashboardData,
  isCentralLandingView,
  isHierarchyLeafSelected,
  nationalDefaultAverageMembersPerHousehold,
  previousAnalyticsRange,
  previousRegularityKpiData,
  previousSchemeQuantityPeriodicData,
  previousSchemeRegularityPeriodicData,
  previousWaterQuantityPeriodicData,
  previousWaterSupplyKpiData,
  schemeRegularityPeriodicData,
  waterQuantityPeriodicData,
}: UseCentralDashboardKpisParams) {
  const currentWaterSupplyKpis = isCentralLandingView
    ? getWaterSupplyKpisFromNationalDashboard(
        filteredNationalDashboardData,
        nationalDefaultAverageMembersPerHousehold
      )
    : isHierarchyLeafSelected
      ? getWaterSupplyKpisFromPeriodic(
          schemeRegularityPeriodicData,
          waterQuantityPeriodicData,
          averagePersonsPerHousehold
        )
      : getWaterSupplyKpis(
          hasWaterSupplyData(currentWaterSupplyKpiData)
            ? currentWaterSupplyKpiData
            : averageWaterSupplyData,
          averagePersonsPerHousehold
        )
  const previousWaterSupplyKpis = isCentralLandingView
    ? getWaterSupplyKpisFromNationalDashboard(
        filteredPreviousNationalDashboardData,
        nationalDefaultAverageMembersPerHousehold
      )
    : isHierarchyLeafSelected
      ? getWaterSupplyKpisFromPeriodic(
          previousSchemeQuantityPeriodicData,
          previousWaterQuantityPeriodicData,
          averagePersonsPerHousehold
        )
      : getWaterSupplyKpis(previousWaterSupplyKpiData, averagePersonsPerHousehold)
  const currentRegularityKpi = isCentralLandingView
    ? getRegularityKpiFromNationalDashboard(filteredNationalDashboardData)
    : isHierarchyLeafSelected
      ? getRegularityKpiFromPeriodic(schemeRegularityPeriodicData)
      : getRegularityKpi(currentRegularityKpiData)
  const previousRegularityKpi = isCentralLandingView
    ? getRegularityKpiFromNationalDashboard(filteredPreviousNationalDashboardData)
    : isHierarchyLeafSelected
      ? getRegularityKpiFromPeriodic(previousSchemeRegularityPeriodicData)
      : getRegularityKpi(previousRegularityKpiData)
  const comparisonDays = resolveDaysInRange(
    undefined,
    previousAnalyticsRange.startDate,
    previousAnalyticsRange.endDate
  )

  return {
    comparisonDays,
    currentRegularityKpi,
    currentWaterSupplyKpis,
    previousRegularityKpi,
    previousWaterSupplyKpis,
  }
}
