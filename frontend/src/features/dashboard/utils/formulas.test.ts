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
  calculateDemandMld,
  calculateReadingSubmissionRatePercent,
  calculateQuantityMld,
  calculateQuantityLpcd,
  getWaterSupplyKpis,
  getWaterSupplyKpisFromPeriodic,
  getRegularityKpiFromPeriodic,
  mapOutageReasonsFromNationalDashboard,
  mapSchemePerformanceToTable,
  mapReadingSubmissionStatusFromAnalytics,
  mapReadingSubmissionRateFromAnalytics,
  mapQuantityPerformanceFromAnalytics,
  mapQuantityPerformanceFromNationalDashboard,
  mapRegularityPerformanceFromAnalytics,
  mapRegularityPerformanceFromNationalDashboard,
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

  it('calculates state KPI totals from scheme rows using totalAchievedFhtcCount when available', () => {
    const response: AverageWaterSupplyPerRegionResponse = {
      tenantId: 17,
      stateCode: 'AS',
      parentLgdLevel: 1,
      parentDepartmentLevel: 0,
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      daysInRange: 30,
      schemeCount: 1,
      childRegionCount: 0,
      schemes: [
        {
          schemeId: 1,
          schemeName: 'Scheme A',
          householdCount: 600,
          totalAchievedFhtcCount: 500,
          totalWaterSuppliedLiters: 90_000_000,
          supplyDays: 30,
          avgLitersPerHousehold: 0,
        },
      ],
      childRegions: [],
    }

    expect(getWaterSupplyKpis(response, 5)).toEqual({
      quantityMld: 3,
      quantityLpcd: 1200,
    })
  })

  it('calculates demand in MLD from FHTC count, persons, and liters per person', () => {
    expect(calculateDemandMld(500, 5, 50)).toBe(0.13)
  })

  it('calculates village KPI totals from periodic water quantity metrics', () => {
    expect(
      getWaterSupplyKpisFromPeriodic({
        lgdId: 19501,
        departmentId: 0,
        scale: 'day',
        startDate: '2026-02-25',
        endDate: '2026-02-26',
        periodCount: 2,
        metrics: [
          {
            periodStartDate: '2026-02-25',
            periodEndDate: '2026-02-25',
            averageWaterQuantity: 41_243,
            householdCount: 0,
            achievedFhtcCount: 501,
            plannedFhtcCount: 448,
          },
          {
            periodStartDate: '2026-02-26',
            periodEndDate: '2026-02-26',
            averageWaterQuantity: 50_100,
            householdCount: 0,
            achievedFhtcCount: 500,
            plannedFhtcCount: 448,
          },
        ],
      })
    ).toEqual({
      quantityMld: 0.05,
      quantityLpcd: 18.3,
    })
  })

  it('prefers totalAchievedFhtcCount over achievedFhtcCount in periodic water quantity metrics', () => {
    expect(
      getWaterSupplyKpisFromPeriodic({
        lgdId: 19501,
        departmentId: 0,
        scale: 'day',
        startDate: '2026-02-25',
        endDate: '2026-02-26',
        periodCount: 2,
        metrics: [
          {
            periodStartDate: '2026-02-25',
            periodEndDate: '2026-02-25',
            averageWaterQuantity: 41_243,
            householdCount: 0,
            totalAchievedFhtcCount: 501,
            achievedFhtcCount: 5,
            plannedFhtcCount: 448,
          },
          {
            periodStartDate: '2026-02-26',
            periodEndDate: '2026-02-26',
            averageWaterQuantity: 50_100,
            householdCount: 0,
            totalAchievedFhtcCount: 500,
            achievedFhtcCount: 5,
            plannedFhtcCount: 448,
          },
        ],
      })
    ).toEqual({
      quantityMld: 0.05,
      quantityLpcd: 18.3,
    })
  })

  it('skips periodic water quantity metrics with invalid metric dates', () => {
    expect(
      getWaterSupplyKpisFromPeriodic({
        lgdId: 19501,
        departmentId: 0,
        scale: 'day',
        startDate: '2026-02-25',
        endDate: '2026-02-26',
        periodCount: 2,
        metrics: [
          {
            periodStartDate: '',
            periodEndDate: '',
            averageWaterQuantity: 999_999,
            householdCount: 0,
            totalAchievedFhtcCount: 999,
            achievedFhtcCount: 999,
            plannedFhtcCount: 448,
          },
          {
            periodStartDate: '2026-02-26',
            periodEndDate: '2026-02-26',
            averageWaterQuantity: 50_100,
            householdCount: 0,
            totalAchievedFhtcCount: 500,
            achievedFhtcCount: 500,
            plannedFhtcCount: 448,
          },
        ],
      })
    ).toEqual({
      quantityMld: 0.05,
      quantityLpcd: 20,
    })
  })

  it('calculates village regularity KPI from periodic regularity metrics', () => {
    expect(
      getRegularityKpiFromPeriodic({
        lgdId: 19501,
        departmentId: 0,
        schemeCount: 1,
        scale: 'day',
        startDate: '2026-02-25',
        endDate: '2026-02-26',
        periodCount: 2,
        metrics: [
          {
            periodStartDate: '2026-02-25',
            periodEndDate: '2026-02-25',
            totalSupplyDays: 1,
            averageRegularity: 100,
          },
          {
            periodStartDate: '2026-02-26',
            periodEndDate: '2026-02-26',
            totalSupplyDays: 0,
            averageRegularity: 0,
          },
        ],
      })
    ).toBe(50)
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

  it('prefers child region totals for KPIs when both schemes and childRegions are present', () => {
    const response: AverageWaterSupplyPerRegionResponse = {
      tenantId: 17,
      stateCode: 'AS',
      parentLgdLevel: 1,
      parentDepartmentLevel: 0,
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      daysInRange: 30,
      schemeCount: 1,
      childRegionCount: 1,
      schemes: [
        {
          schemeId: 1,
          schemeName: 'Scheme A',
          householdCount: 600,
          totalAchievedFhtcCount: 0,
          totalWaterSuppliedLiters: 90_000_000,
          supplyDays: 30,
          avgLitersPerHousehold: 0,
        },
      ],
      childRegions: [
        {
          lgdId: 1,
          departmentId: 0,
          title: 'Region A',
          totalHouseholdCount: 600,
          totalAchievedFhtcCount: 500,
          totalWaterSuppliedLiters: 90_000_000,
          schemeCount: 1,
          avgWaterSupplyPerScheme: 0,
        },
      ],
    }

    expect(getWaterSupplyKpis(response, 5)).toEqual({
      quantityMld: 3,
      quantityLpcd: 1200,
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
          title: 'REGION ALPHA',
          totalHouseholdCount: 1000,
          totalAchievedFhtcCount: 500,
          totalWaterSuppliedLiters: 90_000_000,
          schemeCount: 2,
          avgWaterSupplyPerScheme: 0,
        },
      ],
    }

    expect(mapQuantityPerformanceFromAnalytics(response, fallbackData)).toEqual([
      {
        ...fallbackData[0],
        name: 'Region Alpha',
        coverage: 0.13,
        quantity: 3,
      },
    ])
  })

  it('maps national quantity response using achieved FHTC count for demand when available', () => {
    const fallbackData: EntityPerformance[] = [
      {
        id: 'assam',
        name: 'Assam',
        coverage: 0,
        regularity: 0,
        continuity: 0,
        quantity: 0,
        compositeScore: 68,
        status: 'good',
      },
    ]
    const response: NationalDashboardResponse = {
      startDate: '2026-02-24',
      endDate: '2026-03-25',
      daysInRange: 30,
      stateWiseQuantityPerformance: [
        {
          tenantId: 17,
          stateCode: 'AS',
          stateTitle: 'Assam',
          schemeCount: 17412,
          totalHouseholdCount: 0,
          totalAchievedFhtcCount: 2_150_302_458,
          totalPlannedFhtcCount: 4_022_202,
          totalWaterSuppliedLiters: 15_706_406_504,
          avgWaterSupplyPerScheme: 902044.9405,
        },
      ],
      stateWiseRegularity: [],
      stateWiseReadingSubmissionRate: [],
      overallOutageReasonDistribution: {},
    }

    expect(mapQuantityPerformanceFromNationalDashboard(response, fallbackData)).toEqual([
      expect.objectContaining({
        name: 'Assam',
        coverage: 537575.61,
        quantity: 523.55,
      }),
    ])
  })

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

  it.each([
    ['response is undefined', undefined],
    [
      'response has childRegions: []',
      {
        tenantId: 16,
        stateCode: 'TG',
        parentLgdLevel: 1,
        parentDepartmentLevel: 0,
        startDate: '2026-03-01',
        endDate: '2026-03-30',
        daysInRange: 30,
        schemeCount: 0,
        childRegionCount: 0,
        schemes: [],
        childRegions: [],
      } satisfies AverageWaterSupplyPerRegionResponse,
    ],
  ])(
    'intentionally returns an empty array for quantity analytics when %s, even if fallback data exists',
    (_, response) => {
      expect(mapQuantityPerformanceFromAnalytics(response, fallbackData)).toEqual([])
    }
  )

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
          title: 'REGION ALPHA',
          schemeCount: 3,
          totalSupplyDays: 45,
          averageRegularity: 0,
        },
      ],
    }

    expect(mapRegularityPerformanceFromAnalytics(response, fallbackData)).toEqual([
      {
        ...fallbackData[0],
        name: 'Region Alpha',
        regularity: 50,
      },
    ])
  })

  it('returns an empty array for regularity analytics when child regions are unavailable', () => {
    const fallbackData: EntityPerformance[] = [
      {
        id: 'alpha',
        name: 'Region Alpha',
        coverage: 72,
        regularity: 61,
        continuity: 0,
        quantity: 4,
        compositeScore: 68,
        status: 'good',
      },
    ]

    expect(mapRegularityPerformanceFromAnalytics(undefined, fallbackData)).toEqual([])
  })

  it('returns an empty array for national regularity performance when analytics are unavailable', () => {
    const fallbackData: EntityPerformance[] = [
      {
        id: 'alpha',
        name: 'Region Alpha',
        coverage: 72,
        regularity: 61,
        continuity: 0,
        quantity: 4,
        compositeScore: 68,
        status: 'good',
      },
    ]

    expect(mapRegularityPerformanceFromNationalDashboard(undefined, fallbackData)).toEqual([])
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
          totalAchievedFhtcCount: 500,
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

  it('normalizes inconsistent API casing in overall performance names', () => {
    const waterResponse: AverageWaterSupplyPerRegionResponse = {
      tenantId: 18,
      stateCode: 'AS',
      parentLgdLevel: 1,
      parentDepartmentLevel: 0,
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      daysInRange: 30,
      schemeCount: 1,
      childRegionCount: 1,
      schemes: [],
      childRegions: [
        {
          lgdId: 101,
          departmentId: 0,
          title: 'CHARAIDEO',
          totalHouseholdCount: 100,
          totalAchievedFhtcCount: 100,
          totalWaterSuppliedLiters: 30_000_000,
          schemeCount: 1,
          avgWaterSupplyPerScheme: 0,
        },
      ],
    }
    const regularityResponse: AverageSchemeRegularityResponse = {
      lgdId: 101,
      parentDepartmentId: 0,
      parentLgdLevel: 1,
      parentDepartmentLevel: 0,
      scope: 'child',
      startDate: '2026-03-01',
      endDate: '2026-03-30',
      daysInRange: 30,
      schemeCount: 1,
      totalSupplyDays: 15,
      averageRegularity: 0,
      childRegionCount: 1,
      childRegions: [
        {
          lgdId: 101,
          departmentId: 0,
          title: 'CHARAIDEO',
          schemeCount: 1,
          totalSupplyDays: 15,
          averageRegularity: 0,
        },
      ],
    }

    expect(
      mapOverallPerformanceFromAnalytics(waterResponse, regularityResponse, [], 5)[0]?.name
    ).toBe('Charaideo')
  })

  it('normalizes inconsistent API casing in scheme performance table rows', () => {
    expect(
      mapSchemePerformanceToTable(
        {
          parentLgdId: 1,
          parentDepartmentId: 0,
          parentLgdCName: 'state',
          parentDepartmentCName: '',
          parentLgdTitle: 'Assam',
          parentDepartmentTitle: '',
          startDate: '2026-03-14',
          endDate: '2026-03-14',
          daysInRange: 1,
          activeSchemeCount: 1,
          inactiveSchemeCount: 0,
          topSchemeCount: 1,
          topSchemes: [
            {
              schemeId: 101,
              schemeName: 'AICHARA PARA PWSS',
              statusCode: 1,
              status: 'Active',
              submissionDays: 30,
              reportingRate: 82,
              totalWaterSupplied: 4500,
              immediateParentLgdId: 11,
              immediateParentLgdCName: 'village',
              immediateParentLgdTitle: 'UTTAR PUB PAKA',
              immediateParentDepartmentId: 12,
              immediateParentDepartmentCName: 'block',
              immediateParentDepartmentTitle: 'KALAIGAON',
            },
          ],
        },
        []
      )
    ).toEqual([
      {
        id: 'scheme-performance-101',
        name: 'Aichara Para Pwss',
        village: 'Uttar Pub Paka',
        block: 'Kalaigaon',
        reportingRate: 82,
        photoCompliance: 0,
        waterSupplied: 4500,
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
        reasons: {
          electrical_failure: 0,
          pipeline_leak: 0,
          pump_failure: 0,
          valve_issue: 0,
          source_drying: 0,
        },
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
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      schemeCount: 0,
      compliantSubmissionCount: 0,
      anomalousSubmissionCount: 0,
    }

    expect(mapReadingSubmissionStatusFromAnalytics(response, fallbackData)).toEqual([
      { label: 'Compliant Submissions', value: 0 },
      { label: 'Anomalous Submissions', value: 0 },
    ])
  })
})
