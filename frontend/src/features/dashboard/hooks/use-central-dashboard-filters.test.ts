import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { useCentralDashboardFilters } from './use-central-dashboard-filters'
import { CENTRAL_DASHBOARD_FILTER_STORAGE_KEY } from '../utils/central-dashboard-helpers'

const mockNavigate = jest.fn()
const mockUseParams = jest.fn(() => ({}))
const mockUseSearchParams = jest.fn(() => [new URLSearchParams(), jest.fn()])
const mockUseLocation = jest.fn(() => ({ pathname: '/', search: '', hash: '', state: null }))
const mockIsSingleTenantMode = jest.fn(() => false)

jest.mock('react-router-dom', () => ({
  ...jest.requireActual<typeof import('react-router-dom')>('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
  useSearchParams: () => mockUseSearchParams(),
  useLocation: () => mockUseLocation(),
}))

jest.mock('@/config/server-config', () => ({
  isSingleTenantMode: () => mockIsSingleTenantMode(),
}))

describe('useCentralDashboardFilters', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockNavigate.mockReset()
    mockUseParams.mockReset()
    mockUseSearchParams.mockReset()
    mockUseLocation.mockReset()
    mockIsSingleTenantMode.mockReset()
    mockUseParams.mockReturnValue({})
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()])
    mockUseLocation.mockReturnValue({ pathname: '/', search: '', hash: '', state: null })
    mockIsSingleTenantMode.mockReturnValue(false)
  })

  it('derives administrative selection from slug and URL hierarchy params', () => {
    mockUseParams.mockReturnValue({ stateSlug: 'as' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('district=101:9101:district&block=201:9201:block'),
      jest.fn(),
    ])

    const { result } = renderHook(() =>
      useCentralDashboardFilters({ durationDateFormat: 'DD/MM/YYYY' })
    )

    expect(result.current.selectedState).toBe('assam')
    expect(result.current.selectedDistrict).toBe('101:9101:district')
    expect(result.current.selectedBlock).toBe('201:9201:block')
    expect(result.current.filterTabIndex).toBe(0)
    expect(result.current.effectiveTrailIndex).toBe(2)
    expect(result.current.isBlockSelected).toBe(true)
    expect(result.current.activeHierarchySelectedBlock).toBe('201:9201:block')
  })

  it('derives department tab selection from department URL params', () => {
    mockUseParams.mockReturnValue({ stateSlug: 'as' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('departmentZone=10:100:zone&departmentCircle=20:200:circle'),
      jest.fn(),
    ])

    const { result } = renderHook(() =>
      useCentralDashboardFilters({ durationDateFormat: 'DD/MM/YYYY' })
    )

    expect(result.current.filterTabIndex).toBe(1)
    expect(result.current.selectedDepartmentState).toBe('assam')
    expect(result.current.selectedDepartmentZone).toBe('10:100:zone')
    expect(result.current.selectedDepartmentCircle).toBe('20:200:circle')
    expect(result.current.isDepartmentCircleSelected).toBe(true)
    expect(result.current.hierarchyType).toBe('DEPARTMENT')
  })

  it('navigates with cleared lower administrative filters when district changes', () => {
    mockUseParams.mockReturnValue({ stateSlug: 'as' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('district=old&block=old-block&tab=administrative'),
      jest.fn(),
    ])

    const { result } = renderHook(() =>
      useCentralDashboardFilters({ durationDateFormat: 'DD/MM/YYYY' })
    )

    act(() => {
      result.current.handleDistrictChange('101:9101:district')
    })

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/as',
      search: '?district=101%3A9101%3Adistrict&tab=administrative',
    })
  })

  it('keeps the selected tenant locked when clearing filters in single-tenant mode', () => {
    mockIsSingleTenantMode.mockReturnValue(true)

    const { result } = renderHook(() =>
      useCentralDashboardFilters({
        durationDateFormat: 'DD/MM/YYYY',
        singleTenantOverride: {
          value: 'assam',
          label: 'Assam',
          tenantId: 1,
          tenantCode: 'AS',
        },
      })
    )

    act(() => {
      result.current.handleClearFilters()
    })

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/',
      search: '',
    })
    expect(result.current.selectedState).toBe('assam')
  })

  it('persists selected filters using the same storage key', () => {
    mockUseParams.mockReturnValue({ stateSlug: 'as' })
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams('district=101:9101:district&tab=administrative'),
      jest.fn(),
    ])

    renderHook(() => useCentralDashboardFilters({ durationDateFormat: 'DD/MM/YYYY' }))

    expect(
      JSON.parse(window.localStorage.getItem(CENTRAL_DASHBOARD_FILTER_STORAGE_KEY) ?? '{}')
    ).toMatchObject({
      selectedState: 'assam',
      selectedDistrict: '101:9101:district',
      filterTabIndex: 0,
    })
  })

  it('keeps the duration save-day marker fixed when unrelated filters change across midnight', () => {
    jest.useFakeTimers()
    try {
      // Day 1, just before midnight: the user opens the dashboard and picks a range.
      jest.setSystemTime(new Date('2026-07-22T23:59:00'))

      const { result } = renderHook(() =>
        useCentralDashboardFilters({ durationDateFormat: 'DD/MM/YYYY' })
      )

      act(() => {
        result.current.handleSelectedDurationChange({
          startDate: '01/07/2026',
          endDate: '22/07/2026',
        })
      })

      expect(
        JSON.parse(window.localStorage.getItem(CENTRAL_DASHBOARD_FILTER_STORAGE_KEY) ?? '{}')
          .durationSavedOn
      ).toBe('2026-07-22')

      // The dashboard is left open; the day rolls over and an unrelated filter changes.
      jest.setSystemTime(new Date('2026-07-23T00:01:00'))

      act(() => {
        result.current.setSelectedScheme('jal-jeevan-mission')
      })

      // The marker must still point at the day the range was chosen so the stale
      // selection is reset on the next reload instead of being treated as fresh.
      expect(
        JSON.parse(window.localStorage.getItem(CENTRAL_DASHBOARD_FILTER_STORAGE_KEY) ?? '{}')
          .durationSavedOn
      ).toBe('2026-07-22')
    } finally {
      jest.useRealTimers()
    }
  })
})
