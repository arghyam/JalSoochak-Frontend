import { renderHook } from '@testing-library/react'
import { describe, expect, it } from '@jest/globals'
import { useCentralDashboardKpis } from './use-central-dashboard-kpis'
import type {
  AverageSchemeRegularityResponse,
  AverageWaterSupplyPerRegionResponse,
  NationalDashboardResponse,
  SchemeRegularityPeriodicResponse,
  WaterQuantityPeriodicResponse,
} from '../types'

const emptyNationalResponse: NationalDashboardResponse = {
  startDate: '2026-03-01',
  endDate: '2026-03-30',
  daysInRange: 30,
  stateWiseQuantityPerformance: [],
  stateWiseRegularity: [],
  stateWiseReadingSubmissionRate: [],
  overallOutageReasonDistribution: {},
}

describe('useCentralDashboardKpis', () => {
  it('derives national water and regularity KPIs from national dashboard payloads', () => {
    const nationalResponse: NationalDashboardResponse = {
      ...emptyNationalResponse,
      stateWiseQuantityPerformance: [
        {
          tenantId: 1,
          stateCode: 'AS',
          stateTitle: 'Assam',
          schemeCount: 1,
          supplyDaysInEfficientRange: 30,
          totalHouseholdCount: 100,
          totalAchievedFhtcCount: 500,
          totalWaterSuppliedLiters: 90_000_000,
          avgWaterSupplyPerScheme: 90_000_000,
        },
      ],
      stateWiseRegularity: [
        {
          tenantId: 1,
          stateCode: 'AS',
          stateTitle: 'Assam',
          schemeCount: 1,
          totalSupplyDays: 30,
          regularSchemeCount: 1,
          averageRegularity: 1,
        },
      ],
    }

    const { result } = renderHook(() =>
      useCentralDashboardKpis({
        averagePersonsPerHousehold: 5,
        averageWaterSupplyData: undefined,
        currentRegularityKpiData: undefined,
        currentWaterSupplyKpiData: undefined,
        filteredNationalDashboardData: nationalResponse,
        filteredPreviousNationalDashboardData: emptyNationalResponse,
        isCentralLandingView: true,
        isHierarchyLeafSelected: false,
        nationalDefaultAverageMembersPerHousehold: 5,
        previousAnalyticsRange: { startDate: '2026-01-31', endDate: '2026-02-29' },
        previousRegularityKpiData: undefined,
        previousSchemeQuantityPeriodicData: undefined,
        previousSchemeRegularityPeriodicData: undefined,
        previousWaterQuantityPeriodicData: undefined,
        previousWaterSupplyKpiData: undefined,
        schemeRegularityPeriodicData: undefined,
        waterQuantityPeriodicData: undefined,
      })
    )

    expect(result.current.currentWaterSupplyKpis).toEqual({
      quantityMld: 3,
      quantityLpcd: 1200,
    })
    expect(result.current.currentRegularityKpi).toBe(100)
    expect(result.current.comparisonDays).toBe(30)
  })

  it('derives leaf water and regularity KPIs from periodic payloads', () => {
    const schemeRegularityPeriodicData: SchemeRegularityPeriodicResponse = {
      lgdId: 1,
      departmentId: 0,
      schemeCount: 1,
      scale: 'day',
      startDate: '2026-03-01',
      endDate: '2026-03-02',
      periodCount: 2,
      metrics: [
        {
          periodStartDate: '2026-03-01',
          periodEndDate: '2026-03-01',
          totalSupplyDays: 1,
          totalWaterQuantity: 50_000,
          averageRegularity: 1,
        },
        {
          periodStartDate: '2026-03-02',
          periodEndDate: '2026-03-02',
          totalSupplyDays: 1,
          totalWaterQuantity: 50_000,
          averageRegularity: 1,
        },
      ],
    }
    const waterQuantityPeriodicData: WaterQuantityPeriodicResponse = {
      lgdId: 1,
      departmentId: 0,
      scale: 'day',
      startDate: '2026-03-01',
      endDate: '2026-03-02',
      periodCount: 2,
      metrics: [
        {
          periodStartDate: '2026-03-01',
          periodEndDate: '2026-03-01',
          householdCount: 100,
          achievedFhtcCount: 100,
          plannedFhtcCount: 100,
        },
        {
          periodStartDate: '2026-03-02',
          periodEndDate: '2026-03-02',
          householdCount: 100,
          achievedFhtcCount: 100,
          plannedFhtcCount: 100,
        },
      ],
    }

    const { result } = renderHook(() =>
      useCentralDashboardKpis({
        averagePersonsPerHousehold: 5,
        averageWaterSupplyData: undefined,
        currentRegularityKpiData: undefined,
        currentWaterSupplyKpiData: undefined,
        filteredNationalDashboardData: undefined,
        filteredPreviousNationalDashboardData: undefined,
        isCentralLandingView: false,
        isHierarchyLeafSelected: true,
        nationalDefaultAverageMembersPerHousehold: 5,
        previousAnalyticsRange: { startDate: '2026-02-27', endDate: '2026-02-28' },
        previousRegularityKpiData: undefined,
        previousSchemeQuantityPeriodicData: undefined,
        previousSchemeRegularityPeriodicData: undefined,
        previousWaterQuantityPeriodicData: undefined,
        previousWaterSupplyKpiData: undefined,
        schemeRegularityPeriodicData,
        waterQuantityPeriodicData,
      })
    )

    expect(result.current.currentWaterSupplyKpis).toEqual({
      quantityMld: 0.05,
      quantityLpcd: 100,
    })
    expect(result.current.currentRegularityKpi).toBe(100)
  })

  it('prefers current water-supply KPI payload when it has supplied-water data', () => {
    const currentWaterSupplyKpiData: AverageWaterSupplyPerRegionResponse = {
      tenantId: 1,
      stateCode: 'AS',
      parentLgdLevel: 2,
      parentDepartmentLevel: 0,
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      daysInRange: 30,
      schemeCount: 1,
      childRegionCount: 0,
      currentRegion: {
        lgdId: 4,
        departmentId: null,
        title: null,
        totalHouseholdCount: 600,
        totalAchievedFhtcCount: 500,
        totalWaterSuppliedLiters: 90_000_000,
        schemeCount: 1,
        avgWaterSupplyPerScheme: 90_000_000,
      },
      schemes: [],
      childRegions: [],
    }
    const regularityData: AverageSchemeRegularityResponse = {
      lgdId: 1,
      parentDepartmentId: 0,
      parentLgdLevel: 2,
      parentDepartmentLevel: 0,
      scope: 'current',
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      daysInRange: 30,
      schemeCount: 1,
      totalSupplyDays: 30,
      averageRegularity: 1,
      childRegionCount: 0,
      childRegions: [],
    }

    const { result } = renderHook(() =>
      useCentralDashboardKpis({
        averagePersonsPerHousehold: 5,
        averageWaterSupplyData: undefined,
        currentRegularityKpiData: regularityData,
        currentWaterSupplyKpiData,
        filteredNationalDashboardData: undefined,
        filteredPreviousNationalDashboardData: undefined,
        isCentralLandingView: false,
        isHierarchyLeafSelected: false,
        nationalDefaultAverageMembersPerHousehold: 5,
        previousAnalyticsRange: { startDate: '2026-01-31', endDate: '2026-02-29' },
        previousRegularityKpiData: undefined,
        previousSchemeQuantityPeriodicData: undefined,
        previousSchemeRegularityPeriodicData: undefined,
        previousWaterQuantityPeriodicData: undefined,
        previousWaterSupplyKpiData: undefined,
        schemeRegularityPeriodicData: undefined,
        waterQuantityPeriodicData: undefined,
      })
    )

    expect(result.current.currentWaterSupplyKpis).toEqual({
      quantityMld: 3,
      quantityLpcd: 1200,
    })
    expect(result.current.currentRegularityKpi).toBe(100)
  })
})
