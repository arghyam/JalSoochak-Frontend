import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { DrilldownSource } from '@/shared/lib/analytics'
import type { EntityPerformance } from '../types'
import type { LocationOption } from '../utils/central-dashboard-helpers'
import type { OnboardedPredicate } from '../utils/onboarded-regions'
import { useCentralDashboardNavigation } from './use-central-dashboard-navigation'

type NavigationParams = Parameters<typeof useCentralDashboardNavigation>[0]
type ChangeHandler = (value: string, source?: DrilldownSource) => void

const option = (id: number, label: string): LocationOption => ({
  value: `${id}:${id}:${label.toLowerCase()}`,
  label,
  locationId: id,
  analyticsId: id,
})

const row = (id: number, name: string): EntityPerformance => ({
  id: String(id),
  name,
  coverage: 0,
  regularity: 0,
  continuity: 0,
  quantity: 0,
  compositeScore: 0,
  status: 'good',
})

const onboardedIds =
  (...ids: number[]): OnboardedPredicate =>
  (id) =>
    typeof id === 'number' && ids.includes(id)

const amritsar = option(12, 'Amritsar')
const barnala = option(13, 'Barnala')

describe('useCentralDashboardNavigation onboarded drilldown', () => {
  const handlers = {
    handleBlockChange: jest.fn<ChangeHandler>(),
    handleDepartmentCircleChange: jest.fn<ChangeHandler>(),
    handleDepartmentDivisionChange: jest.fn<ChangeHandler>(),
    handleDepartmentSubdivisionChange: jest.fn<ChangeHandler>(),
    handleDepartmentVillageChange: jest.fn<ChangeHandler>(),
    handleDepartmentZoneChange: jest.fn<ChangeHandler>(),
    handleDistrictChange: jest.fn<ChangeHandler>(),
    handleGramPanchayatChange: jest.fn<ChangeHandler>(),
    handleVillageChange: jest.fn<ChangeHandler>(),
  }

  // A tenant at state level on the administrative tab, with Amritsar onboarded.
  const stateViewParams = (): NavigationParams => ({
    ...handlers,
    boundaryOverallPerformanceOptions: [amritsar, barnala],
    districtToStateMap: new Map(),
    expectedOverallPerformanceOptions: [amritsar],
    isCentralLandingView: false,
    isDepartmentCircleSelected: false,
    isDepartmentDivisionSelected: false,
    isDepartmentStateSelected: false,
    isDepartmentSubdivisionSelected: false,
    isDepartmentTabActive: false,
    isDepartmentZoneSelected: false,
    isHierarchyFourthLevelSelected: false,
    isHierarchySecondLevelSelected: false,
    isHierarchyStateSelected: true,
    isHierarchyThirdLevelSelected: false,
    isMapDistrictView: false,
    isOnboardedByLevel: { district: onboardedIds(12) },
    locationSearchStates: [],
    mapChartData: [],
    overallPerformanceLocationOptions: [amritsar, barnala],
    overallPerformanceTableData: [],
    setActiveTrailIndex: jest.fn(),
    setFilterTabIndex: jest.fn(),
    setHoveredOverallPerformanceRow: jest.fn(),
    setSelectedScheme: jest.fn(),
    updateFilterUrl: jest.fn(),
  })

  const renderNavigation = (overrides: Partial<NavigationParams> = {}) =>
    renderHook(() => useCentralDashboardNavigation({ ...stateViewParams(), ...overrides })).result
      .current

  beforeEach(() => {
    Object.values(handlers).forEach((handler) => handler.mockReset())
  })

  it('drills into an onboarded district from the map', () => {
    renderNavigation().handleMapRegionClick('12', 'Amritsar')

    expect(handlers.handleDistrictChange).toHaveBeenCalledWith(amritsar.value, 'map')
  })

  it('drills into an onboarded district from the table', () => {
    renderNavigation().handleOverallPerformanceRowClick(row(12, 'Amritsar'))

    expect(handlers.handleDistrictChange).toHaveBeenCalledWith(amritsar.value, 'table')
  })

  it('ignores a map click on a district that is not onboarded', () => {
    renderNavigation().handleMapRegionClick('13', 'Barnala')

    expect(handlers.handleDistrictChange).not.toHaveBeenCalled()
  })

  it('ignores a table click on a district that is not onboarded', () => {
    renderNavigation().handleOverallPerformanceRowClick(row(13, 'Barnala'))

    expect(handlers.handleDistrictChange).not.toHaveBeenCalled()
  })

  it.each([
    [
      'map',
      (nav: ReturnType<typeof renderNavigation>) => nav.handleMapRegionClick('13', 'Barnala'),
    ],
    [
      'table',
      (nav: ReturnType<typeof renderNavigation>) =>
        nav.handleOverallPerformanceRowClick(row(13, 'Barnala')),
    ],
  ] as const)('keeps the current selection when a %s click is blocked', (_source, click) => {
    const setActiveTrailIndex = jest.fn()
    const setSelectedScheme = jest.fn()

    click(renderNavigation({ setActiveTrailIndex, setSelectedScheme }))

    expect(setActiveTrailIndex).not.toHaveBeenCalled()
    expect(setSelectedScheme).not.toHaveBeenCalled()
  })

  it('resets the trail and scheme when an onboarded drilldown goes ahead', () => {
    const setActiveTrailIndex = jest.fn()
    const setSelectedScheme = jest.fn()

    renderNavigation({ setActiveTrailIndex, setSelectedScheme }).handleMapRegionClick(
      '12',
      'Amritsar'
    )

    expect(setActiveTrailIndex).toHaveBeenCalledWith(null)
    expect(setSelectedScheme).toHaveBeenCalledWith('')
    expect(handlers.handleDistrictChange).toHaveBeenCalledWith(amritsar.value, 'map')
  })

  it('ignores clicks while the onboarded districts are unknown', () => {
    renderNavigation({ isOnboardedByLevel: {} }).handleMapRegionClick('12', 'Amritsar')

    expect(handlers.handleDistrictChange).not.toHaveBeenCalled()
  })

  it('checks the level the click selects', () => {
    const ajnala = option(120, 'Ajnala')

    renderNavigation({
      isHierarchySecondLevelSelected: true,
      isOnboardedByLevel: { district: onboardedIds(), block: onboardedIds(120) },
      overallPerformanceLocationOptions: [ajnala],
    }).handleOverallPerformanceRowClick(row(120, 'Ajnala'))

    expect(handlers.handleBlockChange).toHaveBeenCalledWith(ajnala.value, 'table')
    expect(handlers.handleDistrictChange).not.toHaveBeenCalled()
  })

  it.each([
    ['departmentZone', { isDepartmentStateSelected: true }, 'handleDepartmentZoneChange'],
    [
      'departmentVillage',
      { isDepartmentStateSelected: true, isDepartmentSubdivisionSelected: true },
      'handleDepartmentVillageChange',
    ],
  ] as const)('drills into an onboarded %s on the departmental tab', (level, flags, handler) => {
    const northZone = option(7, 'North')
    const departmentView: Partial<NavigationParams> = {
      ...flags,
      isDepartmentTabActive: true,
      isHierarchyStateSelected: false,
      overallPerformanceLocationOptions: [northZone],
    }

    renderNavigation({
      ...departmentView,
      isOnboardedByLevel: { [level]: onboardedIds() },
    }).handleOverallPerformanceRowClick(row(7, 'North'))
    expect(handlers[handler]).not.toHaveBeenCalled()

    renderNavigation({
      ...departmentView,
      isOnboardedByLevel: { [level]: onboardedIds(7) },
    }).handleOverallPerformanceRowClick(row(7, 'North'))
    expect(handlers[handler]).toHaveBeenCalledWith(northZone.value, 'table')
  })
})
