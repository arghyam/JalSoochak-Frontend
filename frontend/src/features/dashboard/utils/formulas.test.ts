import { describe, expect, it } from '@jest/globals'
import type {
  AverageSchemeRegularityResponse,
  AverageWaterSupplyPerRegionResponse,
  EntityPerformance,
} from '../types'
import {
  calculateAverageRegularityPercent,
  calculateQuantityMld,
  mapQuantityPerformanceFromAnalytics,
  mapRegularityPerformanceFromAnalytics,
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

  it('calculates average regularity percent from supply days, schemes, and day range', () => {
    expect(calculateAverageRegularityPercent(45, 3, 30)).toBe(50)
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
          totalWaterSuppliedLiters: 90_000_000,
          schemeCount: 2,
          avgWaterSupplyPerScheme: 0,
        },
      ],
    }

    expect(mapQuantityPerformanceFromAnalytics(response, fallbackData)).toEqual([
      {
        ...fallbackData[0],
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
})
