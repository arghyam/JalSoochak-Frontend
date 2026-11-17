import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { OnboardedRegionsResponse } from '../types'
import { useOnboardedChildMetrics } from './use-onboarded-child-metrics'

const mockUseOnboardedRegionsQuery = jest.fn()

jest.mock('../services/query/use-onboarded-regions-query', () => ({
  useOnboardedRegionsQuery: (...args: unknown[]) => mockUseOnboardedRegionsQuery(...args),
}))

const onboarded = (overrides: Partial<OnboardedRegionsResponse> = {}) => ({
  data: {
    tenantId: 3,
    parentLgdId: 1,
    parentDepartmentId: null,
    phasedRollout: true,
    onboardedChildIds: [12],
    ...overrides,
  },
  isLoading: false,
})

const lgdMetrics = () => ({
  averageRegularity: 0.5,
  childRegions: [
    { lgdId: 12, departmentId: null, title: 'Onboarded' },
    { lgdId: 13, departmentId: null, title: 'Not onboarded' },
  ],
})

describe('useOnboardedChildMetrics', () => {
  beforeEach(() => {
    mockUseOnboardedRegionsQuery.mockReset()
    mockUseOnboardedRegionsQuery.mockReturnValue(onboarded())
  })

  it('keeps only the onboarded children of the LGD parent', () => {
    const { result } = renderHook(() =>
      useOnboardedChildMetrics({ tenantId: 3, hierarchyType: 'LGD', parentId: 1 })
    )

    expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({
      params: { tenantId: 3, parentLgdId: 1 },
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isOnboarded?.(12)).toBe(true)
    expect(result.current.isOnboardedChild({ childLgdId: 12 })).toBe(true)
    expect(result.current.isOnboardedChild({ childLgdId: 13 })).toBe(false)
    expect(result.current.retainOnboarded(lgdMetrics())).toEqual({
      averageRegularity: 0.5,
      childRegions: [{ lgdId: 12, departmentId: null, title: 'Onboarded' }],
    })
  })

  it.each(['DEPARTMENT', 'DEPARTMENTAL'] as const)(
    'matches children by department id on the %s hierarchy',
    (hierarchyType) => {
      mockUseOnboardedRegionsQuery.mockReturnValue(
        onboarded({ parentLgdId: null, parentDepartmentId: 7, onboardedChildIds: [21] })
      )

      const { result } = renderHook(() =>
        useOnboardedChildMetrics({ tenantId: 3, hierarchyType, parentId: 7 })
      )

      expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({
        params: { tenantId: 3, parentDepartmentId: 7 },
      })
      expect(
        result.current.retainOnboarded({
          childRegions: [
            { lgdId: 0, departmentId: 21 },
            { lgdId: 0, departmentId: 22 },
          ],
        })
      ).toEqual({ childRegions: [{ lgdId: 0, departmentId: 21 }] })
      expect(result.current.isOnboardedChild({ childLgdId: 0, childDepartmentId: 21 })).toBe(true)
      expect(result.current.isOnboardedChild({ childLgdId: 21, childDepartmentId: 22 })).toBe(false)
    }
  )

  it('keeps no child and reports loading while the onboarded list loads', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue({ data: undefined, isLoading: true })

    const { result } = renderHook(() =>
      useOnboardedChildMetrics({ tenantId: 3, hierarchyType: 'LGD', parentId: 1 })
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isOnboardedChild({ childLgdId: 12 })).toBe(false)
    expect(result.current.retainOnboarded(lgdMetrics())?.childRegions).toEqual([])
  })

  it('keeps no child when the onboarded list failed', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue({ data: undefined, isLoading: false })

    const { result } = renderHook(() =>
      useOnboardedChildMetrics({ tenantId: 3, hierarchyType: 'LGD', parentId: 1 })
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isOnboardedChild({ childLgdId: 12 })).toBe(false)
    expect(result.current.retainOnboarded(lgdMetrics())?.childRegions).toEqual([])
  })

  it('returns the same response while the rollout is off', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue(
      onboarded({ phasedRollout: false, onboardedChildIds: null })
    )
    const response = lgdMetrics()

    const { result } = renderHook(() =>
      useOnboardedChildMetrics({ tenantId: 3, hierarchyType: 'LGD', parentId: 1 })
    )

    expect(result.current.retainOnboarded(response)).toBe(response)
  })

  it.each([
    ['no parent', { tenantId: 3, parentId: undefined }],
    ['no tenant', { tenantId: undefined, parentId: 1 }],
  ])('passes responses through unchanged with %s', (_case, params) => {
    mockUseOnboardedRegionsQuery.mockReturnValue({ data: undefined, isLoading: false })
    const response = lgdMetrics()

    const { result } = renderHook(() =>
      useOnboardedChildMetrics({ ...params, hierarchyType: 'LGD' })
    )

    expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({ params: null })
    expect(result.current.isOnboarded).toBeUndefined()
    expect(result.current.isOnboardedChild({ childLgdId: 13 })).toBe(true)
    expect(result.current.retainOnboarded(response)).toBe(response)
  })

  it('leaves a missing response missing', () => {
    const { result } = renderHook(() =>
      useOnboardedChildMetrics({ tenantId: 3, hierarchyType: 'LGD', parentId: 1 })
    )

    expect(result.current.retainOnboarded(undefined)).toBeUndefined()
  })
})
