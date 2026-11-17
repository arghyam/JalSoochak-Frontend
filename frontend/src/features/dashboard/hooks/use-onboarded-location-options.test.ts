import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { OnboardedRegionsResponse } from '../types'
import { useOnboardedLocationOptions } from './use-onboarded-location-options'

const mockUseOnboardedRegionsQuery = jest.fn()

jest.mock('../services/query/use-onboarded-regions-query', () => ({
  useOnboardedRegionsQuery: (...args: unknown[]) => mockUseOnboardedRegionsQuery(...args),
}))

const options = [
  { value: '12:12:amritsar', label: 'Amritsar', locationId: 12 },
  { value: '13:13:barnala', label: 'Barnala', locationId: 13 },
  { value: '15:15:bathinda', label: 'Bathinda', locationId: 15 },
]

const onboarded = (overrides: Partial<OnboardedRegionsResponse> = {}) => ({
  data: {
    tenantId: 3,
    parentLgdId: 1,
    parentDepartmentId: null,
    phasedRollout: true,
    onboardedChildIds: [12, 15],
    ...overrides,
  },
})

describe('useOnboardedLocationOptions', () => {
  beforeEach(() => {
    mockUseOnboardedRegionsQuery.mockReset()
    mockUseOnboardedRegionsQuery.mockReturnValue(onboarded())
  })

  it('asks for the LGD parent and keeps only onboarded options', () => {
    const { result } = renderHook(() =>
      useOnboardedLocationOptions({ tenantId: 3, hierarchyType: 'LGD', parentId: 1, options })
    )

    expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({
      params: { tenantId: 3, parentLgdId: 1 },
    })
    expect(result.current.options.map((option) => option.label)).toEqual(['Amritsar', 'Bathinda'])
    expect(result.current.isOnboarded?.(13)).toBe(false)
  })

  it('asks for the department parent on the departmental hierarchy', () => {
    renderHook(() =>
      useOnboardedLocationOptions({
        tenantId: 3,
        hierarchyType: 'DEPARTMENT',
        parentId: 7,
        options,
      })
    )

    expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({
      params: { tenantId: 3, parentDepartmentId: 7 },
    })
  })

  it('keeps every option while the rollout is off', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue(
      onboarded({ phasedRollout: false, onboardedChildIds: null })
    )

    const { result } = renderHook(() =>
      useOnboardedLocationOptions({ tenantId: 3, hierarchyType: 'LGD', parentId: 1, options })
    )

    expect(result.current.options).toEqual(options)
  })

  it('offers nothing while the onboarded list is unresolved', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue({ data: undefined })

    const { result } = renderHook(() =>
      useOnboardedLocationOptions({ tenantId: 3, hierarchyType: 'LGD', parentId: 1, options })
    )

    expect(result.current.options).toEqual([])
    expect(result.current.isOnboarded).toBeUndefined()
  })

  it('passes root options through, without asking, when there is no parent', () => {
    const { result } = renderHook(() =>
      useOnboardedLocationOptions({ tenantId: 3, hierarchyType: 'LGD', options })
    )

    expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({ params: null })
    expect(result.current.options).toBe(options)
    expect(result.current.isOnboarded).toBeUndefined()
  })

  it('does not ask without a tenant, and offers nothing', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue({ data: undefined })

    const { result } = renderHook(() =>
      useOnboardedLocationOptions({ hierarchyType: 'LGD', parentId: 1, options })
    )

    expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({ params: null })
    expect(result.current.options).toEqual([])
  })
})
