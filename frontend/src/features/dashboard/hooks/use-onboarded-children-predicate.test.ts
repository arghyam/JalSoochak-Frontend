import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { OnboardedRegionsResponse } from '../types'
import {
  useOnboardedChildren,
  useOnboardedChildrenPredicate,
} from './use-onboarded-children-predicate'

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
    onboardedChildIds: [12, 15],
    ...overrides,
  },
})

describe('useOnboardedChildrenPredicate', () => {
  beforeEach(() => {
    mockUseOnboardedRegionsQuery.mockReset()
    mockUseOnboardedRegionsQuery.mockReturnValue(onboarded())
  })

  it('asks for the LGD parent and allows only its onboarded children', () => {
    const { result } = renderHook(() =>
      useOnboardedChildrenPredicate({ tenantId: 3, hierarchyType: 'LGD', parentId: 1 })
    )

    expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({
      params: { tenantId: 3, parentLgdId: 1 },
    })
    expect(result.current?.(12)).toBe(true)
    expect(result.current?.(13)).toBe(false)
  })

  it('asks for the department parent on the departmental hierarchy', () => {
    renderHook(() =>
      useOnboardedChildrenPredicate({ tenantId: 3, hierarchyType: 'DEPARTMENT', parentId: 7 })
    )

    expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({
      params: { tenantId: 3, parentDepartmentId: 7 },
    })
  })

  it('allows every child while the rollout is off', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue(
      onboarded({ phasedRollout: false, onboardedChildIds: null })
    )

    const { result } = renderHook(() =>
      useOnboardedChildrenPredicate({ tenantId: 3, hierarchyType: 'LGD', parentId: 1 })
    )

    expect(result.current?.(13)).toBe(true)
  })

  it('is unresolved while the onboarded list is loading or failed', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue({ data: undefined })

    const { result } = renderHook(() =>
      useOnboardedChildrenPredicate({ tenantId: 3, hierarchyType: 'LGD', parentId: 1 })
    )

    expect(result.current).toBeUndefined()
  })

  it.each([
    ['no parent', { tenantId: 3, parentId: undefined }],
    ['a parent id that is not positive', { tenantId: 3, parentId: 0 }],
    ['no tenant', { tenantId: undefined, parentId: 1 }],
  ])('does not ask with %s', (_case, params) => {
    mockUseOnboardedRegionsQuery.mockReturnValue({ data: undefined })

    const { result } = renderHook(() =>
      useOnboardedChildrenPredicate({ ...params, hierarchyType: 'LGD' })
    )

    expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({ params: null })
    expect(result.current).toBeUndefined()
  })

  it('keeps the same predicate while the response is unchanged', () => {
    const response = onboarded()
    mockUseOnboardedRegionsQuery.mockReturnValue(response)

    const { result, rerender } = renderHook(() =>
      useOnboardedChildrenPredicate({ tenantId: 3, hierarchyType: 'LGD', parentId: 1 })
    )
    const firstPredicate = result.current
    rerender()

    expect(result.current).toBe(firstPredicate)
  })
})

describe('useOnboardedChildren', () => {
  beforeEach(() => {
    mockUseOnboardedRegionsQuery.mockReset()
  })

  it('reports loading until the onboarded list arrives', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue({ data: undefined, isLoading: true })

    const { result } = renderHook(() =>
      useOnboardedChildren({ tenantId: 3, hierarchyType: 'LGD', parentId: 1 })
    )

    expect(result.current).toEqual({ isOnboarded: undefined, isLoading: true })
  })

  it('returns the predicate once the onboarded list has loaded', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue({ ...onboarded(), isLoading: false })

    const { result } = renderHook(() =>
      useOnboardedChildren({ tenantId: 3, hierarchyType: 'LGD', parentId: 1 })
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isOnboarded?.(12)).toBe(true)
    expect(result.current.isOnboarded?.(13)).toBe(false)
  })

  it('is unresolved but not loading when the onboarded list failed', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue({ data: undefined, isLoading: false })

    const { result } = renderHook(() =>
      useOnboardedChildren({ tenantId: 3, hierarchyType: 'LGD', parentId: 1 })
    )

    expect(result.current).toEqual({ isOnboarded: undefined, isLoading: false })
  })
})
