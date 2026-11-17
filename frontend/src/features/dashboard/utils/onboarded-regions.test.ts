import { describe, expect, it } from '@jest/globals'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type {
  AverageSchemeRegularityChildRegion,
  AverageSchemeRegularityResponse,
  OnboardedRegionsResponse,
  OutageReasonsChildRegion,
  OutageReasonsResponse,
  WaterQuantityRegionWiseChildRegion,
  WaterQuantityRegionWiseResponse,
} from '../types'
import {
  isRegionUnavailableError,
  noRegionOnboarded,
  retainOnboardedChildren,
  toOnboardedPredicate,
} from './onboarded-regions'

const onboardedResponse = (
  overrides: Partial<OnboardedRegionsResponse> = {}
): OnboardedRegionsResponse => ({
  tenantId: 3,
  parentLgdId: 1,
  parentDepartmentId: null,
  phasedRollout: true,
  onboardedChildIds: [12, 15],
  ...overrides,
})

const regularityRegion = (
  overrides: Partial<AverageSchemeRegularityChildRegion>
): AverageSchemeRegularityChildRegion => ({
  lgdId: 0,
  departmentId: null,
  title: 'Region',
  schemeCount: 4,
  totalSupplyDays: 20,
  regularSchemeCount: 2,
  averageRegularity: 0.5,
  ...overrides,
})

const regularityResponse = (
  childRegions: AverageSchemeRegularityChildRegion[]
): AverageSchemeRegularityResponse => ({
  lgdId: 1,
  parentDepartmentId: null,
  parentLgdLevel: 1,
  parentDepartmentLevel: null,
  scope: 'child',
  startDate: '2026-11-01',
  endDate: '2026-11-15',
  daysInRange: 15,
  schemeCount: 12,
  totalSupplyDays: 60,
  averageRegularity: 0.4,
  childRegionCount: childRegions.length,
  childRegions,
})

const outageRegion = (overrides: Partial<OutageReasonsChildRegion>): OutageReasonsChildRegion => ({
  lgdId: 0,
  departmentId: 0,
  title: 'Region',
  outageReasonSchemeCount: { power_failure: 1 },
  ...overrides,
})

const outageResponse = (childRegions: OutageReasonsChildRegion[]): OutageReasonsResponse => ({
  lgdId: 0,
  departmentId: 7,
  startDate: '2026-11-01',
  endDate: '2026-11-15',
  parentLgdLevel: 0,
  parentDepartmentLevel: 2,
  outageReasonSchemeCount: { power_failure: 2 },
  childRegionCount: childRegions.length,
  childRegions,
})

const quantityRegion = (
  overrides: Partial<WaterQuantityRegionWiseChildRegion>
): WaterQuantityRegionWiseChildRegion => ({
  lgdId: 0,
  departmentId: null,
  title: 'Region',
  waterQuantity: 1000,
  householdCount: 10,
  achievedFhtcCount: 8,
  plannedFhtcCount: 10,
  supplyDaysInEfficientRange: 5,
  ...overrides,
})

const quantityResponse = (
  childRegions: WaterQuantityRegionWiseChildRegion[]
): WaterQuantityRegionWiseResponse => ({
  parentLgdId: 1,
  parentDepartmentId: null,
  parentLgdLevel: 1,
  parentDepartmentLevel: null,
  startDate: '2026-11-01',
  endDate: '2026-11-15',
  childRegionCount: childRegions.length,
  childRegions,
})

const resolvedPredicate = (response: OnboardedRegionsResponse) => {
  const predicate = toOnboardedPredicate(response)
  if (!predicate) throw new Error('expected a resolved predicate')
  return predicate
}

describe('toOnboardedPredicate', () => {
  it('is unresolved while there is no response', () => {
    expect(toOnboardedPredicate(undefined)).toBeUndefined()
  })

  it('passes every id, including a missing one, while the rollout is off', () => {
    const isOnboarded = toOnboardedPredicate(
      onboardedResponse({ phasedRollout: false, onboardedChildIds: null })
    )

    expect(isOnboarded?.(12)).toBe(true)
    expect(isOnboarded?.(99)).toBe(true)
    expect(isOnboarded?.(undefined)).toBe(true)
  })

  it('passes only the listed ids while the rollout is on', () => {
    const isOnboarded = toOnboardedPredicate(onboardedResponse())

    expect(isOnboarded?.(12)).toBe(true)
    expect(isOnboarded?.(15)).toBe(true)
    expect(isOnboarded?.(13)).toBe(false)
    expect(isOnboarded?.(undefined)).toBe(false)
  })

  it('passes nothing when the rollout is on and the list is empty or missing', () => {
    expect(toOnboardedPredicate(onboardedResponse({ onboardedChildIds: [] }))?.(12)).toBe(false)
    expect(toOnboardedPredicate(onboardedResponse({ onboardedChildIds: null }))?.(12)).toBe(false)
  })
})

describe('retainOnboardedChildren', () => {
  const isOnboarded = resolvedPredicate(onboardedResponse())

  it('keeps only onboarded LGD children and leaves the other fields alone', () => {
    const response = regularityResponse([
      regularityRegion({ lgdId: 12, title: 'Amritsar' }),
      regularityRegion({ lgdId: 13, title: 'Barnala', averageRegularity: 0 }),
      regularityRegion({ lgdId: 15, title: 'Bathinda' }),
    ])

    const result = retainOnboardedChildren(response, isOnboarded, 'LGD')

    expect(result.childRegions.map((region) => region.title)).toEqual(['Amritsar', 'Bathinda'])
    expect(result).toEqual({ ...response, childRegions: result.childRegions })
  })

  it('identifies department children by department id even when the LGD id is 0', () => {
    const response = outageResponse([
      outageRegion({ lgdId: 0, departmentId: 12, title: 'Zone A' }),
      outageRegion({ lgdId: 0, departmentId: 13, title: 'Zone B' }),
    ])

    const result = retainOnboardedChildren(response, isOnboarded, 'DEPARTMENT')

    expect(result.childRegions.map((region) => region.title)).toEqual(['Zone A'])
  })

  it('does not read a department id on an LGD response', () => {
    const response = regularityResponse([regularityRegion({ lgdId: 13, departmentId: 12 })])

    expect(retainOnboardedChildren(response, isOnboarded, 'LGD').childRegions).toEqual([])
  })

  it('prefers the child alias over the plain id', () => {
    const response = quantityResponse([
      quantityRegion({ childLgdId: 12, lgdId: 13, title: 'Amritsar' }),
      quantityRegion({ childLgdId: 13, lgdId: 12, title: 'Barnala' }),
    ])

    const result = retainOnboardedChildren(response, isOnboarded, 'LGD')

    expect(result.childRegions.map((region) => region.title)).toEqual(['Amritsar'])
  })

  it('drops a child without a usable id while the rollout is on', () => {
    const response = regularityResponse([
      regularityRegion({ lgdId: 0 }),
      regularityRegion({ lgdId: -1 }),
      regularityRegion({ lgdId: 12, title: 'Amritsar' }),
    ])

    const result = retainOnboardedChildren(response, isOnboarded, 'LGD')

    expect(result.childRegions.map((region) => region.title)).toEqual(['Amritsar'])
  })

  it('returns the same response, unchanged, while the rollout is off', () => {
    const response = regularityResponse([regularityRegion({ lgdId: 0 }), regularityRegion({})])
    const everyRegionOnboarded = resolvedPredicate(
      onboardedResponse({ phasedRollout: false, onboardedChildIds: null })
    )

    expect(retainOnboardedChildren(response, everyRegionOnboarded, 'LGD')).toBe(response)
  })

  it('returns a response that has no child list as is', () => {
    const response = { averageRegularity: 0.5 } as unknown as AverageSchemeRegularityResponse

    expect(retainOnboardedChildren(response, isOnboarded, 'LGD')).toBe(response)
  })

  it('does not mutate the input when it removes children', () => {
    const childRegions = [regularityRegion({ lgdId: 12 }), regularityRegion({ lgdId: 13 })]
    const response = regularityResponse(childRegions)

    retainOnboardedChildren(response, isOnboarded, 'LGD')

    expect(response.childRegions).toBe(childRegions)
    expect(response.childRegions).toHaveLength(2)
  })
})

describe('noRegionOnboarded', () => {
  it('passes no id, so a view waiting on the onboarded list fails closed', () => {
    expect(noRegionOnboarded(12)).toBe(false)
    expect(noRegionOnboarded(undefined)).toBe(false)
  })
})

describe('isRegionUnavailableError', () => {
  const httpError = (status: number) => {
    const error = new AxiosError('Request failed')
    error.response = {
      status,
      data: {},
      statusText: '',
      headers: {},
      config: { headers: {} } as InternalAxiosRequestConfig,
    }
    return error
  }

  it('is true for a 404, which hides a region that is not onboarded', () => {
    expect(isRegionUnavailableError(httpError(404))).toBe(true)
  })

  it.each([400, 500])('is false for any other status (%d)', (status) => {
    expect(isRegionUnavailableError(httpError(status))).toBe(false)
  })

  it('is false for a request that got no response', () => {
    expect(isRegionUnavailableError(new AxiosError('Network Error'))).toBe(false)
  })

  it.each([
    ['a plain error', new Error('Not Found')],
    ['no error', null],
  ])('is false for %s', (_case, error) => {
    expect(isRegionUnavailableError(error)).toBe(false)
  })
})
