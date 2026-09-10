import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { DateRange } from '@/shared/components/common'
import { isSingleTenantMode } from '@/config/server-config'
import { useCurrentIsoDate } from '@/shared/hooks/use-current-iso-date'
import {
  clampIsoDateToMax,
  countInclusiveDays,
  isoDateToLocalDate,
} from '@/shared/utils/date-format'
import { resolveDatePresetRange } from '@/shared/utils/date-presets'
import { stateCodeToSlug } from '@/shared/constants/states'
import { trackEvent } from '@/shared/lib/analytics'
import type { DrilldownSource } from '@/shared/lib/analytics'
import type { StateUtOption } from '../types'
import { computeTrailIndices } from '../utils/trail-index'
import {
  CENTRAL_DASHBOARD_FILTER_STORAGE_KEY,
  type FilterUrlUpdate,
  type LocationScopedTrailIndex,
  getCurrentIsoDate,
  getInitialStoredDuration,
  getStoredFilters,
  navigateWithUpdatedFilters,
} from '../utils/central-dashboard-helpers'

type UseCentralDashboardFiltersParams = {
  durationDateFormat: string
  singleTenantOverride?: StateUtOption
}

export function useCentralDashboardFilters({
  durationDateFormat,
  singleTenantOverride,
}: UseCentralDashboardFiltersParams) {
  const { stateSlug = '' } = useParams<{ stateSlug?: string }>()
  const [searchParams] = useSearchParams()
  const searchParamsSnapshot = searchParams.toString()
  const location = useLocation()
  const navigate = useNavigate()
  const hasSingleTenantOverride = Boolean(singleTenantOverride)
  const [storedFilters] = useState(() => getStoredFilters())
  const selectedState = singleTenantOverride?.value ?? stateCodeToSlug(stateSlug) ?? stateSlug
  const selectedDistrict = selectedState ? (searchParams.get('district') ?? '') : ''
  const selectedBlock = selectedDistrict ? (searchParams.get('block') ?? '') : ''
  const selectedGramPanchayat = selectedBlock ? (searchParams.get('gramPanchayat') ?? '') : ''
  const selectedVillage = selectedGramPanchayat ? (searchParams.get('village') ?? '') : ''
  const selectedDepartmentZoneFromUrl = searchParams.get('departmentZone') ?? ''
  const selectedDepartmentCircleFromUrl = searchParams.get('departmentCircle') ?? ''
  const selectedDepartmentDivisionFromUrl = searchParams.get('departmentDivision') ?? ''
  const selectedDepartmentSubdivisionFromUrl = searchParams.get('departmentSubdivision') ?? ''
  const selectedDepartmentVillageFromUrl = searchParams.get('departmentVillage') ?? ''
  const isAdministrativeTabFromUrl = searchParams.get('tab') === 'administrative'
  const hasDepartmentParamsInUrl = Boolean(
    selectedDepartmentZoneFromUrl ||
    selectedDepartmentCircleFromUrl ||
    selectedDepartmentDivisionFromUrl ||
    selectedDepartmentSubdivisionFromUrl ||
    selectedDepartmentVillageFromUrl
  )
  const hasLgdParamsInUrl = Boolean(
    selectedDistrict || selectedBlock || selectedGramPanchayat || selectedVillage
  )
  const hasStoredLgdFilters = Boolean(
    storedFilters.selectedState ||
    storedFilters.selectedDistrict ||
    storedFilters.selectedBlock ||
    storedFilters.selectedGramPanchayat ||
    storedFilters.selectedVillage
  )
  const hasStoredDepartmentFilters = Boolean(
    storedFilters.selectedDepartmentState ||
    storedFilters.selectedDepartmentZone ||
    storedFilters.selectedDepartmentCircle ||
    storedFilters.selectedDepartmentDivision ||
    storedFilters.selectedDepartmentSubdivision
  )
  const shouldHydrateFromStoredFilters =
    !selectedState &&
    !hasLgdParamsInUrl &&
    !hasDepartmentParamsInUrl &&
    !isAdministrativeTabFromUrl &&
    (hasStoredLgdFilters || hasStoredDepartmentFilters)
  // Live calendar day. Drives the day-rollover reset below, so a dashboard left open
  // behaves exactly like one that was reloaded.
  const currentIsoDate = useCurrentIsoDate()
  const [selectedDuration, setSelectedDuration] = useState<DateRange | null>(() =>
    getInitialStoredDuration(storedFilters)
  )
  const [isDurationCleared, setIsDurationCleared] = useState(false)
  // Local calendar day the currently-selected duration was chosen. Stamped only when
  // a concrete duration is picked so unrelated filter persists cannot refresh it.
  const [durationSavedOn, setDurationSavedOn] = useState(
    () => storedFilters.durationSavedOn ?? getCurrentIsoDate()
  )
  const [selectedScheme, setSelectedScheme] = useState(storedFilters.selectedScheme ?? '')
  const [storedSelectedDepartmentState, setSelectedDepartmentState] = useState(
    storedFilters.selectedDepartmentState ?? ''
  )
  const [storedSelectedDepartmentZone, setSelectedDepartmentZone] = useState(
    selectedDepartmentZoneFromUrl || storedFilters.selectedDepartmentZone || ''
  )
  const [storedSelectedDepartmentCircle, setSelectedDepartmentCircle] = useState(
    selectedDepartmentCircleFromUrl || storedFilters.selectedDepartmentCircle || ''
  )
  const [storedSelectedDepartmentDivision, setSelectedDepartmentDivision] = useState(
    selectedDepartmentDivisionFromUrl || storedFilters.selectedDepartmentDivision || ''
  )
  const [storedSelectedDepartmentSubdivision, setSelectedDepartmentSubdivision] = useState(
    selectedDepartmentSubdivisionFromUrl || storedFilters.selectedDepartmentSubdivision || ''
  )
  const [storedSelectedDepartmentVillage, setSelectedDepartmentVillage] = useState(
    selectedDepartmentVillageFromUrl || storedFilters.selectedDepartmentVillage || ''
  )
  const [storedFilterTabIndex, setFilterTabIndex] = useState(
    hasDepartmentParamsInUrl
      ? 1
      : typeof storedFilters.filterTabIndex === 'number'
        ? storedFilters.filterTabIndex
        : 0
  )
  const selectedDepartmentState = hasDepartmentParamsInUrl
    ? selectedState
    : storedSelectedDepartmentState
  const selectedDepartmentZone = hasDepartmentParamsInUrl
    ? selectedDepartmentZoneFromUrl
    : storedSelectedDepartmentZone
  const selectedDepartmentCircle = hasDepartmentParamsInUrl
    ? selectedDepartmentCircleFromUrl
    : storedSelectedDepartmentCircle
  const selectedDepartmentDivision = hasDepartmentParamsInUrl
    ? selectedDepartmentDivisionFromUrl
    : storedSelectedDepartmentDivision
  const selectedDepartmentSubdivision = hasDepartmentParamsInUrl
    ? selectedDepartmentSubdivisionFromUrl
    : storedSelectedDepartmentSubdivision
  const selectedDepartmentVillage = hasDepartmentParamsInUrl
    ? selectedDepartmentVillageFromUrl
    : storedSelectedDepartmentVillage
  const filterTabIndex = hasDepartmentParamsInUrl
    ? 1
    : isAdministrativeTabFromUrl || hasLgdParamsInUrl
      ? 0
      : storedFilterTabIndex
  const [activeTrailIndexState, setActiveTrailIndexState] = useState<LocationScopedTrailIndex>({
    pathname: location.pathname,
    search: location.search,
    value: null,
  })
  const previousLocationRef = useRef<{ pathname: string; search: string } | null>(null)
  const hasAppliedStoredHydrationRef = useRef(false)
  const shouldPausePersistenceForHydrationRef = useRef(false)
  const activeTrailIndex =
    activeTrailIndexState.pathname === location.pathname &&
    activeTrailIndexState.search === location.search
      ? activeTrailIndexState.value
      : null
  const setActiveTrailIndex = (value: number | null) => {
    setActiveTrailIndexState({
      pathname: location.pathname,
      search: location.search,
      value,
    })
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const previousLocation = previousLocationRef.current
    const didLocationChange =
      previousLocation !== null &&
      (previousLocation.pathname !== location.pathname ||
        previousLocation.search !== location.search)

    if (isAdministrativeTabFromUrl) {
      setFilterTabIndex(0)
      setSelectedDepartmentState('')
      setSelectedDepartmentZone('')
      setSelectedDepartmentCircle('')
      setSelectedDepartmentDivision('')
      setSelectedDepartmentSubdivision('')
      setSelectedDepartmentVillage('')
      previousLocationRef.current = {
        pathname: location.pathname,
        search: location.search,
      }
      return
    }

    if (hasDepartmentParamsInUrl) {
      setFilterTabIndex(1)
      setSelectedDepartmentState(selectedState)
      setSelectedDepartmentZone(selectedDepartmentZoneFromUrl)
      setSelectedDepartmentCircle(selectedDepartmentCircleFromUrl)
      setSelectedDepartmentDivision(selectedDepartmentDivisionFromUrl)
      setSelectedDepartmentSubdivision(selectedDepartmentSubdivisionFromUrl)
      setSelectedDepartmentVillage(selectedDepartmentVillageFromUrl)
    } else if (didLocationChange && storedFilterTabIndex === 1) {
      setSelectedDepartmentState(selectedState)
      setSelectedDepartmentZone('')
      setSelectedDepartmentCircle('')
      setSelectedDepartmentDivision('')
      setSelectedDepartmentSubdivision('')
      setSelectedDepartmentVillage('')
    }

    previousLocationRef.current = {
      pathname: location.pathname,
      search: location.search,
    }
  }, [
    hasDepartmentParamsInUrl,
    isAdministrativeTabFromUrl,
    location.pathname,
    location.search,
    selectedDepartmentCircleFromUrl,
    selectedDepartmentDivisionFromUrl,
    selectedDepartmentSubdivisionFromUrl,
    selectedDepartmentVillageFromUrl,
    selectedDepartmentZoneFromUrl,
    selectedState,
    storedFilterTabIndex,
  ])
  /* eslint-enable react-hooks/set-state-in-effect */

  const selectionTrailValues = [
    selectedState,
    selectedDistrict,
    selectedBlock,
    selectedGramPanchayat,
    selectedVillage,
  ]
  const { effectiveTrailIndex } = computeTrailIndices(selectionTrailValues, activeTrailIndex)
  const effectiveSelectedState = effectiveTrailIndex >= 0 ? selectedState : ''
  const effectiveSelectedDistrict = effectiveTrailIndex >= 1 ? selectedDistrict : ''
  const effectiveSelectedBlock = effectiveTrailIndex >= 2 ? selectedBlock : ''
  const effectiveSelectedGramPanchayat = effectiveTrailIndex >= 3 ? selectedGramPanchayat : ''
  const effectiveSelectedVillage = effectiveTrailIndex >= 4 ? selectedVillage : ''
  const isLgdTabActive = filterTabIndex === 0
  const isStateSelected = isLgdTabActive && Boolean(effectiveSelectedState)
  const isDistrictSelected = isLgdTabActive && Boolean(effectiveSelectedDistrict)
  const isBlockSelected = isLgdTabActive && Boolean(effectiveSelectedBlock)
  const isGramPanchayatSelected = isLgdTabActive && Boolean(effectiveSelectedGramPanchayat)
  const isVillageSelected = isLgdTabActive && Boolean(effectiveSelectedVillage)
  const isDepartmentTabActive = !isLgdTabActive
  const effectiveSelectedDepartmentState =
    isDepartmentTabActive && !selectedDepartmentState ? selectedState : selectedDepartmentState
  const isDepartmentStateSelected =
    isDepartmentTabActive && Boolean(effectiveSelectedDepartmentState)
  const isDepartmentZoneSelected = isDepartmentTabActive && Boolean(selectedDepartmentZone)
  const isDepartmentCircleSelected = isDepartmentTabActive && Boolean(selectedDepartmentCircle)
  const isDepartmentDivisionSelected = isDepartmentTabActive && Boolean(selectedDepartmentDivision)
  const isDepartmentSubdivisionSelected =
    isDepartmentTabActive && Boolean(selectedDepartmentSubdivision)
  const isDepartmentVillageSelected = isDepartmentTabActive && Boolean(selectedDepartmentVillage)
  const isHierarchyStateSelected = isLgdTabActive ? isStateSelected : isDepartmentStateSelected
  const isHierarchySecondLevelSelected = isLgdTabActive
    ? isDistrictSelected
    : isDepartmentZoneSelected
  const isHierarchyThirdLevelSelected = isLgdTabActive
    ? isBlockSelected
    : isDepartmentCircleSelected
  const isHierarchyFourthLevelSelected = isLgdTabActive
    ? isGramPanchayatSelected
    : isDepartmentDivisionSelected
  const isHierarchyLeafSelected = isLgdTabActive
    ? isVillageSelected
    : isDepartmentSubdivisionSelected || isDepartmentVillageSelected
  const activeLeafSelection = isLgdTabActive
    ? effectiveSelectedVillage
    : selectedDepartmentVillage || selectedDepartmentSubdivision
  const hasLgdLandingFilters =
    isStateSelected ||
    isDistrictSelected ||
    isBlockSelected ||
    isGramPanchayatSelected ||
    isVillageSelected
  const hasDepartmentLandingFilters =
    Boolean(effectiveSelectedDepartmentState) ||
    Boolean(selectedDepartmentZone) ||
    Boolean(selectedDepartmentCircle) ||
    Boolean(selectedDepartmentDivision) ||
    Boolean(selectedDepartmentSubdivision) ||
    Boolean(selectedDepartmentVillage)
  const hasCentralLandingFilters =
    filterTabIndex === 0 ? hasLgdLandingFilters : hasDepartmentLandingFilters
  const hierarchyType = filterTabIndex === 0 ? ('LGD' as const) : ('DEPARTMENT' as const)
  const activeHierarchySelectedState = isDepartmentTabActive
    ? effectiveSelectedDepartmentState
    : selectedState
  const activeHierarchySelectedDistrict = isDepartmentTabActive
    ? selectedDepartmentZone
    : selectedDistrict
  const activeHierarchySelectedBlock = isDepartmentTabActive
    ? selectedDepartmentCircle
    : selectedBlock
  const activeHierarchySelectedGramPanchayat = isDepartmentTabActive
    ? selectedDepartmentDivision
    : selectedGramPanchayat
  const isAdvancedEnabled = Boolean(selectedState && selectedDistrict)
  const effectiveSelectedDuration =
    selectedDuration ??
    (isDurationCleared
      ? null
      : getInitialStoredDuration(storedFilters, durationDateFormat, currentIsoDate))
  const handleSelectedDurationChange: Dispatch<SetStateAction<DateRange | null>> = (value) => {
    setSelectedDuration((previousDuration) => {
      const nextDuration = typeof value === 'function' ? value(previousDuration) : value
      setIsDurationCleared(nextDuration === null)
      if (nextDuration !== null) {
        // Refresh the save-day marker only when a concrete duration is chosen. Other
        // filter changes reuse this stored value so a dashboard left open across
        // midnight cannot silently keep a stale range alive.
        setDurationSavedOn(currentIsoDate)
        // Only concrete picks are reported: a null duration is the clear-filters path, not
        // a duration the user chose.
        trackEvent('duration_change', {
          days: countInclusiveDays(nextDuration.startDate, nextDuration.endDate),
          ...(nextDuration.presetId ? { preset_id: nextDuration.presetId } : {}),
          is_custom: !nextDuration.presetId,
        })
      }
      return nextDuration
    })
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  // Day rollover in an already-open tab. Without this the reset below only ever ran at
  // mount, so a long-lived tab kept serving the previous day's range indefinitely.
  useEffect(() => {
    if (durationSavedOn === currentIsoDate) {
      return
    }

    setDurationSavedOn(currentIsoDate)

    if (selectedDuration === null) {
      return
    }

    const activePresetId = selectedDuration.presetId
    if (activePresetId) {
      // A preset is a rule, so re-resolve it: "Yesterday" must follow the new day.
      const resolvedRange = resolveDatePresetRange(
        activePresetId,
        isoDateToLocalDate(currentIsoDate)
      )
      setSelectedDuration({
        ...resolvedRange,
        // "This week"/"This month" run past today. The picker trims their tail to the
        // ceiling when applied, so re-resolution must do the same or the range would
        // silently start querying future dates.
        endDate: clampIsoDateToMax(resolvedRange.endDate, currentIsoDate),
        presetId: activePresetId,
      })
      return
    }

    // An explicitly typed range has no rule to re-resolve, so it expires the same way a
    // reload would expire it and the dashboard falls back to the current-day default.
    setSelectedDuration(null)
    setIsDurationCleared(true)
  }, [currentIsoDate, durationSavedOn, selectedDuration])
  /* eslint-enable react-hooks/set-state-in-effect */
  const updateFilterUrl = (filters: FilterUrlUpdate, source?: DrilldownSource) => {
    navigateWithUpdatedFilters({
      filters,
      navigate,
      searchParamsSnapshot,
      selectedState,
      singleTenantOverride: hasSingleTenantOverride,
      source,
    })
  }

  useEffect(() => {
    if (!shouldHydrateFromStoredFilters || hasAppliedStoredHydrationRef.current) {
      return
    }
    hasAppliedStoredHydrationRef.current = true
    shouldPausePersistenceForHydrationRef.current = true

    if (storedFilters.filterTabIndex === 1 && hasStoredDepartmentFilters) {
      navigateWithUpdatedFilters({
        navigate,
        searchParamsSnapshot,
        selectedState,
        singleTenantOverride: hasSingleTenantOverride,
        filters: {
          state: storedFilters.selectedDepartmentState || storedFilters.selectedState || '',
          district: '',
          block: '',
          gramPanchayat: '',
          village: '',
          departmentZone: storedFilters.selectedDepartmentZone ?? '',
          departmentCircle: storedFilters.selectedDepartmentCircle ?? '',
          departmentDivision: storedFilters.selectedDepartmentDivision ?? '',
          departmentSubdivision: storedFilters.selectedDepartmentSubdivision ?? '',
        },
      })
      return
    }

    navigateWithUpdatedFilters({
      navigate,
      searchParamsSnapshot,
      selectedState,
      singleTenantOverride: hasSingleTenantOverride,
      filters: {
        state: storedFilters.selectedState ?? '',
        district: storedFilters.selectedDistrict ?? '',
        block: storedFilters.selectedBlock ?? '',
        gramPanchayat: storedFilters.selectedGramPanchayat ?? '',
        village: storedFilters.selectedVillage ?? '',
        tab: 'administrative',
      },
    })
  }, [
    hasStoredDepartmentFilters,
    shouldHydrateFromStoredFilters,
    storedFilters.filterTabIndex,
    storedFilters.selectedBlock,
    storedFilters.selectedDepartmentCircle,
    storedFilters.selectedDepartmentDivision,
    storedFilters.selectedDepartmentState,
    storedFilters.selectedDepartmentSubdivision,
    storedFilters.selectedDepartmentZone,
    storedFilters.selectedDistrict,
    storedFilters.selectedGramPanchayat,
    storedFilters.selectedState,
    storedFilters.selectedVillage,
    navigate,
    searchParamsSnapshot,
    selectedState,
    hasSingleTenantOverride,
  ])

  useEffect(() => {
    if (!shouldHydrateFromStoredFilters) {
      shouldPausePersistenceForHydrationRef.current = false
    }
  }, [shouldHydrateFromStoredFilters])

  const handleStateChange = (value: string) => {
    if (!value) {
      hasAppliedStoredHydrationRef.current = true
    }
    setActiveTrailIndex(null)
    setSelectedScheme('')
    const nextTab = value ? 'administrative' : undefined
    updateFilterUrl({
      state: value,
      district: '',
      block: '',
      gramPanchayat: '',
      village: '',
      tab: nextTab,
    })
  }
  const handleDistrictChange = (value: string, source?: DrilldownSource) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    updateFilterUrl(
      {
        state: selectedState,
        district: value,
        block: '',
        gramPanchayat: '',
        village: '',
        tab: 'administrative',
      },
      source
    )
  }
  const handleBlockChange = (value: string, source?: DrilldownSource) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    updateFilterUrl(
      {
        state: selectedState,
        district: selectedDistrict,
        block: value,
        gramPanchayat: '',
        village: '',
        tab: 'administrative',
      },
      source
    )
  }
  const handleGramPanchayatChange = (value: string, source?: DrilldownSource) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    updateFilterUrl(
      {
        state: selectedState,
        district: selectedDistrict,
        block: selectedBlock,
        gramPanchayat: value,
        village: '',
        tab: 'administrative',
      },
      source
    )
  }
  const handleVillageChange = (value: SetStateAction<string>, source?: DrilldownSource) => {
    setActiveTrailIndex(null)
    setSelectedScheme('')
    const nextVillage = typeof value === 'function' ? value(selectedVillage) : value
    updateFilterUrl(
      {
        state: selectedState,
        district: selectedDistrict,
        block: selectedBlock,
        gramPanchayat: selectedGramPanchayat,
        village: nextVillage,
        tab: 'administrative',
      },
      source
    )
  }
  const handleFilterTabChange = (nextTabIndex: number) => {
    if (nextTabIndex === filterTabIndex) {
      return
    }

    setFilterTabIndex(nextTabIndex)
    // Index 0 is the administrative (LGD) hierarchy, 1 is departmental.
    trackEvent('filter_tab_switch', {
      from: filterTabIndex === 0 ? 'administrative' : 'departmental',
      to: nextTabIndex === 0 ? 'administrative' : 'departmental',
    })

    if (nextTabIndex === 0) {
      updateFilterUrl({
        state: selectedState,
        district: selectedDistrict,
        block: selectedBlock,
        gramPanchayat: selectedGramPanchayat,
        village: selectedVillage,
        departmentZone: '',
        departmentCircle: '',
        departmentDivision: '',
        departmentSubdivision: '',
        departmentVillage: '',
        tab: 'administrative',
      })
    } else {
      setActiveTrailIndex(null)
      setSelectedDepartmentState('')
      setSelectedDepartmentZone('')
      setSelectedDepartmentCircle('')
      setSelectedDepartmentDivision('')
      setSelectedDepartmentSubdivision('')
      setSelectedDepartmentVillage('')
      updateFilterUrl({
        state: selectedState,
        district: '',
        block: '',
        gramPanchayat: '',
        village: '',
        departmentZone: '',
        departmentCircle: '',
        departmentDivision: '',
        departmentSubdivision: '',
        departmentVillage: '',
      })
    }
  }
  const handleDepartmentStateChange = (value: string, source?: DrilldownSource) => {
    setSelectedDepartmentState(value)
    setSelectedDepartmentZone('')
    setSelectedDepartmentCircle('')
    setSelectedDepartmentDivision('')
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
    setSelectedScheme('')
    updateFilterUrl(
      {
        state: value,
        departmentZone: '',
        departmentCircle: '',
        departmentDivision: '',
        departmentSubdivision: '',
        departmentVillage: '',
      },
      source
    )
  }
  const handleDepartmentZoneChange = (value: string, source?: DrilldownSource) => {
    setSelectedDepartmentZone(value)
    setSelectedDepartmentCircle('')
    setSelectedDepartmentDivision('')
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
    setSelectedScheme('')
    updateFilterUrl(
      {
        state: selectedState,
        departmentZone: value,
        departmentCircle: '',
        departmentDivision: '',
        departmentSubdivision: '',
        departmentVillage: '',
      },
      source
    )
  }
  const handleDepartmentCircleChange = (value: string, source?: DrilldownSource) => {
    setSelectedDepartmentCircle(value)
    setSelectedDepartmentDivision('')
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
    setSelectedScheme('')
    updateFilterUrl(
      {
        state: selectedState,
        departmentZone: selectedDepartmentZone,
        departmentCircle: value,
        departmentDivision: '',
        departmentSubdivision: '',
        departmentVillage: '',
      },
      source
    )
  }
  const handleDepartmentDivisionChange = (value: string, source?: DrilldownSource) => {
    setSelectedDepartmentDivision(value)
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
    setSelectedScheme('')
    updateFilterUrl(
      {
        state: selectedState,
        departmentZone: selectedDepartmentZone,
        departmentCircle: selectedDepartmentCircle,
        departmentDivision: value,
        departmentSubdivision: '',
        departmentVillage: '',
      },
      source
    )
  }
  const handleDepartmentSubdivisionChange = (value: string, source?: DrilldownSource) => {
    setSelectedDepartmentSubdivision(value)
    setSelectedDepartmentVillage('')
    setSelectedScheme('')
    updateFilterUrl(
      {
        state: selectedState,
        departmentZone: selectedDepartmentZone,
        departmentCircle: selectedDepartmentCircle,
        departmentDivision: selectedDepartmentDivision,
        departmentSubdivision: value,
        departmentVillage: '',
      },
      source
    )
  }
  const handleDepartmentVillageChange = (value: string, source?: DrilldownSource) => {
    setSelectedDepartmentVillage(value)
    setSelectedScheme('')
    updateFilterUrl(
      {
        state: selectedState,
        departmentZone: selectedDepartmentZone,
        departmentCircle: selectedDepartmentCircle,
        departmentDivision: selectedDepartmentDivision,
        departmentSubdivision: selectedDepartmentSubdivision,
        departmentVillage: value,
      },
      source
    )
  }
  const handleClearFilters = () => {
    hasAppliedStoredHydrationRef.current = true
    setActiveTrailIndex(null)
    setFilterTabIndex(0)
    updateFilterUrl(
      {
        state: isSingleTenantMode() ? selectedState : '',
        district: '',
        block: '',
        gramPanchayat: '',
        village: '',
        departmentZone: '',
        departmentCircle: '',
        departmentDivision: '',
        departmentSubdivision: '',
        departmentVillage: '',
      },
      'clear'
    )
    handleSelectedDurationChange(null)
    setSelectedScheme('')
    setSelectedDepartmentState('')
    setSelectedDepartmentZone('')
    setSelectedDepartmentCircle('')
    setSelectedDepartmentDivision('')
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
  }

  useEffect(() => {
    if (shouldPausePersistenceForHydrationRef.current) {
      return
    }

    const payload = {
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedGramPanchayat,
      selectedVillage,
      selectedDuration: effectiveSelectedDuration,
      durationSavedOn,
      selectedScheme,
      selectedDepartmentState,
      selectedDepartmentZone,
      selectedDepartmentCircle,
      selectedDepartmentDivision,
      selectedDepartmentSubdivision,
      selectedDepartmentVillage,
      filterTabIndex,
    }
    try {
      localStorage.setItem(CENTRAL_DASHBOARD_FILTER_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore storage errors (quota/private mode)
    }
  }, [
    durationSavedOn,
    effectiveSelectedDuration,
    filterTabIndex,
    selectedBlock,
    selectedDistrict,
    selectedDepartmentCircle,
    selectedDepartmentDivision,
    selectedDepartmentState,
    selectedDepartmentSubdivision,
    selectedDepartmentVillage,
    selectedDepartmentZone,
    selectedGramPanchayat,
    selectedScheme,
    selectedState,
    selectedVillage,
    shouldHydrateFromStoredFilters,
  ])

  return {
    activeHierarchySelectedBlock,
    activeHierarchySelectedDistrict,
    activeHierarchySelectedGramPanchayat,
    activeHierarchySelectedState,
    activeLeafSelection,
    effectiveSelectedBlock,
    effectiveSelectedDepartmentState,
    effectiveSelectedDistrict,
    effectiveSelectedDuration,
    effectiveSelectedGramPanchayat,
    effectiveSelectedState,
    effectiveSelectedVillage,
    effectiveTrailIndex,
    filterTabIndex,
    handleBlockChange,
    handleClearFilters,
    handleDepartmentCircleChange,
    handleDepartmentDivisionChange,
    handleDepartmentStateChange,
    handleDepartmentSubdivisionChange,
    handleDepartmentVillageChange,
    handleDepartmentZoneChange,
    handleDistrictChange,
    handleFilterTabChange,
    handleGramPanchayatChange,
    handleSelectedDurationChange,
    handleStateChange,
    handleVillageChange,
    hasCentralLandingFilters,
    hierarchyType,
    isAdvancedEnabled,
    isBlockSelected,
    isDepartmentCircleSelected,
    isDepartmentDivisionSelected,
    isDepartmentStateSelected,
    isDepartmentSubdivisionSelected,
    isDepartmentTabActive,
    isDepartmentVillageSelected,
    isDepartmentZoneSelected,
    isDistrictSelected,
    isGramPanchayatSelected,
    isHierarchyFourthLevelSelected,
    isHierarchyLeafSelected,
    isHierarchySecondLevelSelected,
    isHierarchyStateSelected,
    isHierarchyThirdLevelSelected,
    isLgdTabActive,
    isStateSelected,
    isVillageSelected,
    selectedBlock,
    selectedDepartmentCircle,
    selectedDepartmentDivision,
    selectedDepartmentState,
    selectedDepartmentSubdivision,
    selectedDepartmentVillage,
    selectedDepartmentZone,
    selectedDistrict,
    selectedDuration,
    selectedGramPanchayat,
    selectedScheme,
    selectedState,
    selectedVillage,
    setActiveTrailIndex,
    setFilterTabIndex,
    setSelectedScheme,
    updateFilterUrl,
  }
}
