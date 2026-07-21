import { describe, expect, it, jest } from '@jest/globals'
import type { NavigateFunction } from 'react-router-dom'
import type {
  EntityPerformance,
  NationalDashboardBoundaryResponse,
  NationalDashboardResponse,
  WaterSupplyOutageData,
} from '../types'
import {
  filterNationalDashboardBoundariesByTenantIds,
  filterNationalDashboardByTenantIds,
  findLocationOption,
  getInitialStoredDuration,
  isActiveTenantStatus,
  mapLocationOptions,
  mapNationalBoundariesToPerformance,
  navigateWithUpdatedFilters,
  parseLocationId,
  resolveLgdAnalyticsParentId,
  sortByMetricDescending,
  sortOutageDistributionByTotalDescending,
  toIsoDate,
  toOutageDistributionData,
  toOutageReasonsData,
  toStateSlug,
} from './central-dashboard-helpers'

const fallbackPerformance: EntityPerformance = {
  id: '9',
  name: 'Fallback State',
  coverage: 10,
  regularity: 20,
  continuity: 30,
  quantity: 40,
  compositeScore: 50,
  status: 'good',
}

describe('central dashboard helpers', () => {
  it('treats only ACTIVE as an active tenant status', () => {
    expect(isActiveTenantStatus('ACTIVE')).toBe(true)
    expect(isActiveTenantStatus('INACTIVE')).toBe(false)
    expect(isActiveTenantStatus('SUSPENDED')).toBe(false)
    expect(isActiveTenantStatus('ONBOARDED')).toBe(false)
    expect(isActiveTenantStatus()).toBe(false)
    expect(isActiveTenantStatus('')).toBe(false)
  })

  it('keeps ISO dates and parses configured display dates', () => {
    expect(toIsoDate('2026-03-01')).toBe('2026-03-01')
    expect(toIsoDate('01/03/2026', 'DD/MM/YYYY')).toBe('2026-03-01')
    expect(toIsoDate('')).toBeUndefined()
    expect(toIsoDate(new Date('2026-03-02T00:00:00'))).toBe('2026-03-02')
  })

  it('returns stored duration only when both dates are valid past dates', () => {
    const storedDuration = {
      startDate: '01/03/2026',
      endDate: '07/03/2026',
    }

    expect(getInitialStoredDuration({ selectedDuration: storedDuration }, 'DD/MM/YYYY')).toBe(
      storedDuration
    )
    expect(
      getInitialStoredDuration({
        selectedDuration: {
          startDate: '07/03/2026',
          endDate: '01/03/2026',
        },
      })
    ).toBeNull()
    expect(
      getInitialStoredDuration({
        selectedDuration: {
          startDate: '01/03/2026',
          endDate: '08/05/2099',
        },
      })
    ).toBeNull()
  })

  it('maps child locations to stable options and resolves selected options by id or slug', () => {
    const options = mapLocationOptions([
      { id: 101, title: 'north block', lgdCode: 9001 },
      { id: 0, title: 'ignored' },
      { id: 102, title: '  ' },
    ])

    expect(options).toEqual([
      {
        value: '101:9001:north-block',
        label: 'North Block',
        locationId: 101,
        analyticsId: 9001,
      },
      {
        value: '0:0:ignored',
        label: 'Ignored',
        locationId: 0,
        analyticsId: 0,
      },
    ])
    expect(parseLocationId('101:9001:north-block')).toBe(101)
    expect(findLocationOption(options, '101:9001:north-block')).toBe(options[0])
    expect(findLocationOption(options, 'north-block')).toBe(options[0])
  })

  it('resolves LGD analytics parent from deepest selected hierarchy value', () => {
    expect(
      resolveLgdAnalyticsParentId({
        selectedVillage: '',
        selectedGramPanchayat: '301:9301:gp',
        selectedBlock: '201:9201:block',
        selectedDistrict: '101:9101:district',
        villageOptions: [],
        gramPanchayatOptions: [],
        blockOptions: [],
        districtOptions: [],
        rootAnalyticsId: 9001,
      })
    ).toBe(9301)

    expect(
      resolveLgdAnalyticsParentId({
        selectedVillage: '',
        selectedGramPanchayat: '',
        selectedBlock: '',
        selectedDistrict: '',
        villageOptions: [],
        gramPanchayatOptions: [],
        blockOptions: [],
        districtOptions: [],
        rootAnalyticsId: 9001,
      })
    ).toBe(9001)
  })

  it('maps national boundaries using fallback performance when tenant id matches', () => {
    const response: NationalDashboardBoundaryResponse = {
      nationalBoundary: null,
      stateWiseBoundaries: [
        {
          tenantId: 9,
          lgdId: 0,
          tenantStatus: 1,
          stateCode: 'AS',
          stateTitle: 'Assam',
          boundary: { type: 'Polygon', coordinates: [] },
        },
      ],
    }

    expect(mapNationalBoundariesToPerformance(response, [fallbackPerformance])).toEqual([
      {
        ...fallbackPerformance,
        name: 'Assam',
        boundaryGeoJson: { type: 'Polygon', coordinates: [] },
      },
    ])
  })

  it('filters national dashboard rows and clears aggregate outage reasons when rows are removed', () => {
    const response: NationalDashboardResponse = {
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      daysInRange: 31,
      stateWiseQuantityPerformance: [
        {
          tenantId: 1,
          stateCode: 'AS',
          stateTitle: 'Assam',
          schemeCount: 1,
          supplyDaysInEfficientRange: 1,
          totalHouseholdCount: 10,
          totalAchievedFhtcCount: 8,
          totalWaterSuppliedLiters: 100,
          avgWaterSupplyPerScheme: 100,
        },
        {
          tenantId: 2,
          stateCode: 'BR',
          stateTitle: 'Bihar',
          schemeCount: 1,
          supplyDaysInEfficientRange: 1,
          totalHouseholdCount: 20,
          totalAchievedFhtcCount: 18,
          totalWaterSuppliedLiters: 200,
          avgWaterSupplyPerScheme: 200,
        },
      ],
      stateWiseRegularity: [
        {
          tenantId: 1,
          stateCode: 'AS',
          stateTitle: 'Assam',
          schemeCount: 1,
          totalSupplyDays: 10,
          regularSchemeCount: 1,
          averageRegularity: 10,
        },
        {
          tenantId: 2,
          stateCode: 'BR',
          stateTitle: 'Bihar',
          schemeCount: 1,
          totalSupplyDays: 20,
          regularSchemeCount: 1,
          averageRegularity: 20,
        },
      ],
      stateWiseReadingSubmissionRate: [
        {
          tenantId: 1,
          stateCode: 'AS',
          stateTitle: 'Assam',
          schemeCount: 1,
          totalSubmissionDays: 10,
          readingSubmissionRate: 10,
        },
        {
          tenantId: 2,
          stateCode: 'BR',
          stateTitle: 'Bihar',
          schemeCount: 1,
          totalSubmissionDays: 20,
          readingSubmissionRate: 20,
        },
      ],
      overallOutageReasonDistribution: { pump_failure: 5 },
    }

    expect(filterNationalDashboardByTenantIds(response, new Set([1]))).toEqual({
      ...response,
      stateWiseQuantityPerformance: [response.stateWiseQuantityPerformance[0]],
      stateWiseRegularity: [response.stateWiseRegularity[0]],
      stateWiseReadingSubmissionRate: [response.stateWiseReadingSubmissionRate[0]],
      overallOutageReasonDistribution: {},
    })
  })

  it('filters national dashboard boundaries by active tenant ids', () => {
    const response: NationalDashboardBoundaryResponse = {
      nationalBoundary: null,
      stateWiseBoundaries: [
        { tenantId: 1, lgdId: 1, tenantStatus: 1, stateCode: 'AS', stateTitle: 'Assam' },
        { tenantId: 2, lgdId: 2, tenantStatus: 1, stateCode: 'BR', stateTitle: 'Bihar' },
      ],
    }

    expect(filterNationalDashboardBoundariesByTenantIds(response, new Set([2]))).toEqual({
      ...response,
      stateWiseBoundaries: [response.stateWiseBoundaries[1]],
    })
  })

  it('maps and sorts outage rows using raw reason totals first', () => {
    const outageRows = toOutageDistributionData([
      {
        title: 'beta',
        outageReasonSchemeCount: {
          pump_failure: 1,
          custom_reason: 10,
        },
      },
      {
        title: 'alpha',
        outageReasonSchemeCount: {
          electrical_failure: 4,
        },
      },
    ])

    expect(outageRows[0]).toEqual({
      label: 'Beta',
      reasons: {
        pump_failure: 1,
        custom_reason: 10,
      },
      electricityFailure: 0,
      pipelineLeak: 0,
      pumpFailure: 1,
      valveIssue: 0,
      sourceDrying: 0,
    })
    expect(sortOutageDistributionByTotalDescending(outageRows).map((row) => row.label)).toEqual([
      'Beta',
      'Alpha',
    ])
  })

  it('sorts performance rows by metric descending and then name', () => {
    const rows: EntityPerformance[] = [
      { ...fallbackPerformance, id: '1', name: 'Beta', quantity: 20 },
      { ...fallbackPerformance, id: '2', name: 'Alpha', quantity: 20 },
      { ...fallbackPerformance, id: '3', name: 'Gamma', quantity: 30 },
    ]

    expect(sortByMetricDescending(rows, 'quantity').map((row) => row.name)).toEqual([
      'Gamma',
      'Alpha',
      'Beta',
    ])
  })

  it('keeps navigation behavior for normal and single-tenant filter updates', () => {
    const navigate = jest.fn() as unknown as NavigateFunction

    navigateWithUpdatedFilters({
      filters: {
        state: 'assam',
        district: '101:9101:district',
        tab: 'administrative',
      },
      navigate,
      searchParamsSnapshot: 'block=old&departmentZone=zone',
      selectedState: '',
    })

    expect(navigate).toHaveBeenCalledWith({
      pathname: '/as',
      search: '?district=101%3A9101%3Adistrict&tab=administrative',
    })

    navigateWithUpdatedFilters({
      filters: {
        state: '',
        district: '101:9101:district',
      },
      navigate,
      searchParamsSnapshot: '',
      selectedState: 'assam',
      singleTenantOverride: true,
    })

    expect(navigate).toHaveBeenLastCalledWith({
      pathname: '/',
      search: '?district=101%3A9101%3Adistrict',
    })
  })

  it('slugifies state names with the same fallback behavior as before', () => {
    expect(toStateSlug(' Jammu & Kashmir ')).toBe('jammu-kashmir')
  })

  it('falls back to explicit outage category totals when reasons are empty', () => {
    const rows: WaterSupplyOutageData[] = [
      {
        label: 'Beta',
        reasons: {},
        electricityFailure: 0,
        pipelineLeak: 0,
        pumpFailure: 2,
        valveIssue: 0,
        sourceDrying: 0,
      },
      {
        label: 'Alpha',
        reasons: {},
        electricityFailure: 0,
        pipelineLeak: 0,
        pumpFailure: 2,
        valveIssue: 0,
        sourceDrying: 0,
      },
    ]

    expect(sortOutageDistributionByTotalDescending(rows).map((row) => row.label)).toEqual([
      'Alpha',
      'Beta',
    ])
    expect(toOutageReasonsData({ electricityFailure: 3 }).electricityFailure).toBe(3)
  })
})
