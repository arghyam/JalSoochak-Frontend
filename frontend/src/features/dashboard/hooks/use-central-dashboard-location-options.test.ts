import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { OnboardedRegionsQueryParams } from '../types'
import { useCentralDashboardLocationOptions } from './use-central-dashboard-location-options'

const mockUseLocationChildrenQuery = jest.fn()
const mockUseOnboardedRegionsQuery = jest.fn()

jest.mock('../services/query/use-location-children-query', () => ({
  useLocationChildrenQuery: (...args: unknown[]) => mockUseLocationChildrenQuery(...args),
}))

jest.mock('../services/query/use-onboarded-regions-query', () => ({
  useOnboardedRegionsQuery: (...args: unknown[]) => mockUseOnboardedRegionsQuery(...args),
}))

type ChildrenArgs = { parentId?: number }
type OnboardedArgs = { params: OnboardedRegionsQueryParams | null }

const locations = (...entries: Array<[number, string]>) => ({
  data: { data: entries.map(([id, title]) => ({ id, title })) },
})

// Punjab (1) → districts 12, 13, 15 → district 12's blocks 120, 121 → block 120's GPs 1200, 1201.
const childrenByParent: Record<string, ReturnType<typeof locations>> = {
  root: locations([1, 'Punjab']),
  1: locations([12, 'Amritsar'], [13, 'Barnala'], [15, 'Bathinda']),
  12: locations([120, 'Ajnala'], [121, 'Attari']),
  120: locations([1200, 'Bhalla Pind'], [1201, 'Chamiari']),
}

const onboardedByParent: Record<number, number[]> = {
  1: [12, 15],
  12: [120],
  120: [1201],
}

const baseParams = {
  selectedTenant: { value: 'punjab', label: 'Punjab', tenantId: 3, tenantCode: 'PB' },
  hierarchyType: 'LGD' as const,
  activeHierarchySelectedState: 'punjab',
  activeHierarchySelectedDistrict: '',
  activeHierarchySelectedBlock: '',
  activeHierarchySelectedGramPanchayat: '',
  effectiveSelectedDistrict: '',
  effectiveSelectedBlock: '',
  effectiveSelectedGramPanchayat: '',
  effectiveSelectedVillage: '',
  selectedDepartmentVillage: '',
  selectedDepartmentSubdivision: '',
  selectedDepartmentDivision: '',
  selectedDepartmentCircle: '',
  selectedDepartmentZone: '',
  effectiveSelectedDepartmentState: '',
  isDepartmentTabActive: false,
  isDepartmentStateSelected: false,
  isDepartmentZoneSelected: false,
  isDepartmentCircleSelected: false,
  isDepartmentDivisionSelected: false,
}

const labels = (options: Array<{ label: string }>) => options.map((option) => option.label)

describe('useCentralDashboardLocationOptions onboarded filtering', () => {
  beforeEach(() => {
    mockUseLocationChildrenQuery.mockReset()
    mockUseOnboardedRegionsQuery.mockReset()
    mockUseLocationChildrenQuery.mockImplementation((args: unknown) => {
      const { parentId } = args as ChildrenArgs
      return childrenByParent[parentId === undefined ? 'root' : String(parentId)] ?? {}
    })
    mockUseOnboardedRegionsQuery.mockImplementation((args: unknown) => {
      const { params } = args as OnboardedArgs
      const parentId = params?.parentLgdId ?? params?.parentDepartmentId
      if (parentId === undefined) return { data: undefined }
      return {
        data: {
          tenantId: 3,
          parentLgdId: params?.parentLgdId ?? null,
          parentDepartmentId: params?.parentDepartmentId ?? null,
          phasedRollout: true,
          onboardedChildIds: onboardedByParent[parentId] ?? [],
        },
      }
    })
  })

  it('keeps only onboarded children at every LGD level below the state', () => {
    const { result } = renderHook(() =>
      useCentralDashboardLocationOptions({
        ...baseParams,
        activeHierarchySelectedDistrict: '12:12:amritsar',
        activeHierarchySelectedBlock: '120:120:ajnala',
      })
    )

    expect(labels(result.current.districtApiOptions)).toEqual(['Amritsar', 'Bathinda'])
    expect(labels(result.current.blockApiOptions)).toEqual(['Ajnala'])
    expect(labels(result.current.gramPanchayatApiOptions)).toEqual(['Chamiari'])
    expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({
      params: { tenantId: 3, parentLgdId: 12 },
    })
  })

  it('asks with department parents on the departmental tab', () => {
    const { result } = renderHook(() =>
      useCentralDashboardLocationOptions({
        ...baseParams,
        hierarchyType: 'DEPARTMENT',
        activeHierarchySelectedState: '1:1:punjab',
        activeHierarchySelectedDistrict: '12:12:north-zone',
        effectiveSelectedDepartmentState: '1:1:punjab',
        selectedDepartmentZone: '12:12:north-zone',
        isDepartmentTabActive: true,
        isDepartmentStateSelected: true,
        isDepartmentZoneSelected: true,
      })
    )

    expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({
      params: { tenantId: 3, parentDepartmentId: 1 },
    })
    expect(mockUseOnboardedRegionsQuery).toHaveBeenCalledWith({
      params: { tenantId: 3, parentDepartmentId: 12 },
    })
    expect(labels(result.current.districtApiOptions)).toEqual(['Amritsar', 'Bathinda'])
    expect(labels(result.current.tenantBoundaryLocationOptions)).toEqual(['Ajnala'])
  })

  it('offers no children while a level is unresolved, but keeps the URL-driven parent id', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue({ data: undefined })

    const { result } = renderHook(() =>
      useCentralDashboardLocationOptions({
        ...baseParams,
        activeHierarchySelectedDistrict: '12:12:amritsar',
        effectiveSelectedDistrict: '12:12:amritsar',
      })
    )

    expect(result.current.districtApiOptions).toEqual([])
    expect(result.current.blockApiOptions).toEqual([])
    expect(result.current.analyticsParentId).toBe(12)
  })

  it('keeps every child while the rollout is off', () => {
    mockUseOnboardedRegionsQuery.mockReturnValue({
      data: {
        tenantId: 3,
        parentLgdId: 1,
        parentDepartmentId: null,
        phasedRollout: false,
        onboardedChildIds: null,
      },
    })

    const { result } = renderHook(() => useCentralDashboardLocationOptions(baseParams))

    expect(labels(result.current.districtApiOptions)).toEqual(['Amritsar', 'Barnala', 'Bathinda'])
  })
})
