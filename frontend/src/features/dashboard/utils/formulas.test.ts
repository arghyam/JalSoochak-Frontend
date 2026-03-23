import { describe, expect, it } from '@jest/globals'
import type {
  AverageSchemeRegularityResponse,
  AverageWaterSupplyPerRegionResponse,
  EntityPerformance,
  NationalDashboardResponse,
  ReadingSubmissionStatusData,
  ReadingSubmissionRateResponse,
  SubmissionStatusResponse,
  WaterSupplyOutageData,
} from '../types'
import {
  calculateAverageRegularityPercent,
  calculateReadingSubmissionRatePercent,
  calculateQuantityMld,
  calculateQuantityLpcd,
  getWaterSupplyKpis,
  mapOutageReasonsFromNationalDashboard,
  mapReadingSubmissionStatusFromAnalytics,
  mapReadingSubmissionRateFromAnalytics,
  mapQuantityPerformanceFromAnalytics,
  mapRegularityPerformanceFromAnalytics,
  mapOverallPerformanceFromAnalytics,
  resolveDaysInRange,
} from './formulas'

describe('dashboard formulas', () => {
  it('resolves days in range from payload value first', () => {
    expect(resolveDaysInRange(7, '2026-03-01', '2026-03-30')).toBe(7)
  })

  it('falls back to inclusive date difference for days in range', () => {
    expect(resolveDaysInRange(0, '2026-03-01', '2026-03-07')).toBe(7)
  })

  it('calculates quantity in MLD from liters and day range', () => {
    expect(calculateQuantityMld(90_000_000, 30)).toBe(3)
  })

  it('calculates quantity in LPCD from liters, FHTC count, day range, and P', () => {
    expect(calculateQuantityLpcd(90_000_000, 500, 30, 5)).toBe(1200)
  })

  it('calculates state KPI totals from child regions when scheme rows are absent', () => {
    const response: AverageWaterSupplyPerRegionResponse = {
      tenantId: 17,
      stateCode: 'AS',
      parentLgdLevel: 1,
      parentDepartmentLevel: 0,
      startDate: '2026-02-17',
      endDate: '2026-03-18',
      daysInRange: 30,
      schemeCount: 0,
      childRegionCount: 2,
      schemes: [],
      childRegions: [
        {
          lgdId: 2,
          departmentId: 0,
          title: 'Bajali',
          totalHouseholdCount: 0,
          totalWaterSuppliedLiters: 216_834_394,
          schemeCount: 214,
          avgWaterSupplyPerScheme: 0,
        },
        {
          lgdId: 3,
          departmentId: 0,
          title: 'Baksa',
          totalHouseholdCount: 0,
          totalWaterSuppliedLiters: 469_808_868,
          schemeCount: 523,
          avgWaterSupplyPerScheme: 0,
        },
      ],
    }

    expect(getWaterSupplyKpis(response, 5)).toEqual({
      quantityMld: 22.89,
      quantityLpcd: 0,
    })
  })

  it('calculates average regularity percent from supply days, schemes, and day range', () => {
    expect(calculateAverageRegularityPercent(45, 3, 30)).toBe(50)
  })

  it('calculates reading submission rate percent from submission days, schemes, and day range', () => {
    expect(calculateReadingSubmissionRatePercent(45, 3, 30)).toBe(50)
  })

  it('maps quantity analytics response into chart data with fallback metadata', () => {
    const fallbackData: EntityPerformance[] = [
      {
        id: 'alpha',
        name: 'Region Alpha',
        coverage: 72,
        regularity: 65,
        continuity: 0,
        quantity: 0,
        compositeScore: 68,
        status: 'good',
      },
    ]
    const response: AverageWaterSupplyPerRegionResponse = {
      tenantId: 16,
      stateCode: 'TG',
      parentLgdLevel: 1,
      parentDepartmentLevel: 0,
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      daysInRange: 30,
      schemeCount: 2,
      childRegionCount: 1,
      schemes: [],
      childRegions: [
        {
          lgdId: 100,
          departmentId: 0,
          title: 'Region Alpha',
          totalHouseholdCount: 1000,
          totalFhtcCount: 500,
          totalWaterSuppliedLiters: 90_000_000,
          schemeCount: 2,
          avgWaterSupplyPerScheme: 0,
        },
      ],
    }

    expect(mapQuantityPerformanceFromAnalytics(response, fallbackData)).toEqual([
      {
        ...fallbackData[0],
        coverage: 0,
        quantity: 3,
      },
    ])
  })

  it('maps regularity analytics response into chart data with fallback metadata', () => {
    const fallbackData: EntityPerformance[] = [
      {
        id: 'alpha',
        name: 'Region Alpha',
        coverage: 72,
        regularity: 0,
        continuity: 0,
        quantity: 4,
        compositeScore: 68,
        status: 'good',
      },
    ]
    const response: AverageSchemeRegularityResponse = {
      lgdId: 100,
      parentDepartmentId: 0,
      parentLgdLevel: 1,
      parentDepartmentLevel: 0,
      scope: 'child',
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      daysInRange: 30,
      schemeCount: 3,
      totalSupplyDays: 45,
      averageRegularity: 0,
      childRegionCount: 1,
      childRegions: [
        {
          lgdId: 100,
          departmentId: 0,
          title: 'Region Alpha',
          schemeCount: 3,
          totalSupplyDays: 45,
          averageRegularity: 0,
        },
      ],
    }

    expect(mapRegularityPerformanceFromAnalytics(response, fallbackData)).toEqual([
      {
        ...fallbackData[0],
        regularity: 50,
      },
    ])
  })

  it('maps overall performance rows from quantity and regularity child responses', () => {
    const fallbackData: EntityPerformance[] = [
      {
        id: 'alpha',
        name: 'Region Alpha',
        coverage: 0,
        regularity: 0,
        continuity: 0,
        quantity: 0,
        compositeScore: 68,
        status: 'good',
      },
    ]
    const waterResponse: AverageWaterSupplyPerRegionResponse = {
      tenantId: 16,
      stateCode: 'TG',
      parentLgdLevel: 1,
      parentDepartmentLevel: 0,
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      daysInRange: 30,
      schemeCount: 2,
      childRegionCount: 1,
      schemes: [],
      childRegions: [
        {
          lgdId: 100,
          departmentId: 0,
          title: 'Region Alpha',
          totalHouseholdCount: 1000,
          totalFhtcCount: 500,
          totalWaterSuppliedLiters: 90_000_000,
          schemeCount: 2,
          avgWaterSupplyPerScheme: 0,
        },
      ],
    }
    const regularityResponse: AverageSchemeRegularityResponse = {
      lgdId: 100,
      parentDepartmentId: 0,
      parentLgdLevel: 1,
      parentDepartmentLevel: 0,
      scope: 'child',
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      daysInRange: 30,
      schemeCount: 3,
      totalSupplyDays: 45,
      averageRegularity: 0,
      childRegionCount: 1,
      childRegions: [
        {
          lgdId: 100,
          departmentId: 0,
          title: 'Region Alpha',
          schemeCount: 3,
          totalSupplyDays: 45,
          averageRegularity: 0,
        },
      ],
    }

    expect(
      mapOverallPerformanceFromAnalytics(waterResponse, regularityResponse, fallbackData, 5)
    ).toEqual([
      {
        ...fallbackData[0],
        coverage: 3,
        quantity: 1200,
        regularity: 50,
      },
    ])
  })

  it('maps reading submission rate analytics response into chart data with fallback metadata', () => {
    const fallbackData: EntityPerformance[] = [
      {
        id: 'alpha',
        name: 'Region Alpha',
        coverage: 72,
        regularity: 0,
        continuity: 0,
        quantity: 4,
        compositeScore: 68,
        status: 'good',
      },
    ]
    const response: ReadingSubmissionRateResponse = {
      parentLgdId: 100,
      parentDepartmentId: 0,
      parentLgdLevel: 1,
      parentDepartmentLevel: 0,
      scope: 'child',
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      daysInRange: 30,
      schemeCount: 3,
      totalSubmissionDays: 45,
      readingSubmissionRate: 50,
      childRegionCount: 1,
      childRegions: [
        {
          lgdId: 100,
          departmentId: 0,
          title: 'Region Alpha',
          schemeCount: 3,
          totalSubmissionDays: 45,
          readingSubmissionRate: 87.5,
        },
      ],
    }

    expect(mapReadingSubmissionRateFromAnalytics(response, fallbackData)).toEqual([
      {
        ...fallbackData[0],
        regularity: 50,
      },
    ])
  })

  it('uses a zero-valued outage distribution instead of fallback data', () => {
    const fallbackData: WaterSupplyOutageData[] = [
      {
        label: 'Fallback',
        electricityFailure: 2,
        pipelineLeak: 1,
        pumpFailure: 3,
        valveIssue: 4,
        sourceDrying: 5,
      },
    ]
    const response: NationalDashboardResponse = {
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      daysInRange: 31,
      stateWiseQuantityPerformance: [],
      stateWiseRegularity: [],
      stateWiseReadingSubmissionRate: [],
      overallOutageReasonDistribution: {
        electrical_failure: 0,
        pipeline_leak: 0,
        pump_failure: 0,
        valve_issue: 0,
        source_drying: 0,
      },
    }

    expect(mapOutageReasonsFromNationalDashboard(response, fallbackData)).toEqual([
      {
        label: 'Outages',
        electricityFailure: 0,
        pipelineLeak: 0,
        pumpFailure: 0,
        valveIssue: 0,
        sourceDrying: 0,
      },
    ])
  })

  it('uses a zero-valued submission status response instead of fallback data', () => {
    const fallbackData: ReadingSubmissionStatusData[] = [
      { label: 'Compliant Submissions', value: 7 },
      { label: 'Anomalous Submissions', value: 5 },
    ]
    const response: SubmissionStatusResponse = {
      userId: 12,
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      schemeCount: 0,
      compliantSubmissionCount: 0,
      anomalousSubmissionCount: 0,
      dailySubmissionSchemeDistribution: [],
    }

    expect(mapReadingSubmissionStatusFromAnalytics(response, fallbackData)).toEqual([
      { label: 'Compliant Submissions', value: 0 },
      { label: 'Anomalous Submissions', value: 0 },
    ])
  })
})
