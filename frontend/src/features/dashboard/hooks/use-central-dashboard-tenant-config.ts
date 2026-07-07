import { useTenantPublicConfigQuery } from '../services/query/use-tenant-public-config-query'
import type { StateUtOption } from '../types'
import { slugify } from '../utils/format-location-label'
import { parseStableLocationValue } from '../utils/stable-location-value'
import { DEFAULT_SCREEN_DATE_FORMAT, normalizeDateFormat } from '@/shared/utils/date-format'
import { getRuntimeConfig } from '@/config/runtime-config'
import { isActiveTenantStatus, resolvePositiveNumber } from '../utils/central-dashboard-helpers'

type UseCentralDashboardTenantConfigParams = {
  singleTenantOverride?: StateUtOption
  locationSearchStates: StateUtOption[]
  selectedState: string
  isDepartmentTabActive: boolean
  effectiveSelectedDepartmentState: string
  isVillageSelected: boolean
  isGramPanchayatSelected: boolean
  isBlockSelected: boolean
  isDistrictSelected: boolean
  isDepartmentDivisionSelected: boolean
  isDepartmentCircleSelected: boolean
  isDepartmentZoneSelected: boolean
}

export function useCentralDashboardTenantConfig({
  singleTenantOverride,
  locationSearchStates,
  selectedState,
  isDepartmentTabActive,
  effectiveSelectedDepartmentState,
  isVillageSelected,
  isGramPanchayatSelected,
  isBlockSelected,
  isDistrictSelected,
  isDepartmentDivisionSelected,
  isDepartmentCircleSelected,
  isDepartmentZoneSelected,
}: UseCentralDashboardTenantConfigParams) {
  const selectedTenant = (() => {
    if (singleTenantOverride) {
      if (typeof singleTenantOverride.tenantId !== 'number' || singleTenantOverride.tenantId <= 0) {
        return undefined
      }
      return singleTenantOverride
    }

    // Only ACTIVE tenants are reachable. A non-ACTIVE (or unknown) slug resolves to no
    // tenant → the dashboard stays on the national view.
    const activeStates = locationSearchStates.filter((option) =>
      isActiveTenantStatus(option.status)
    )

    const byStateSlug = activeStates.find((option) => option.value === selectedState)
    if (byStateSlug) {
      return byStateSlug
    }

    if (isDepartmentTabActive && activeStates.length > 0) {
      if (activeStates.length === 1) {
        return activeStates[0]
      }

      const departmentKey = parseStableLocationValue(effectiveSelectedDepartmentState).lastSegment
      if (departmentKey) {
        return (
          activeStates.find(
            (option) => option.value === departmentKey || slugify(option.label) === departmentKey
          ) ?? activeStates[0]
        )
      }
    }

    return undefined
  })()

  const {
    data: tenantPublicConfig,
    isLoading: isTenantPublicConfigLoading,
    isFetching: isTenantPublicConfigFetching,
  } = useTenantPublicConfigQuery({
    tenantId: selectedTenant?.tenantId,
    enabled: Boolean(selectedTenant?.tenantId),
  })

  const runtimeConfig = getRuntimeConfig()
  const defaultAverageMembersPerHousehold = resolvePositiveNumber(
    runtimeConfig.DEFAULT_AVERAGE_MEMBERS_PER_HOUSEHOLD,
    5
  )
  const defaultWaterNormLitersPerPersonPerDay = resolvePositiveNumber(
    runtimeConfig.DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY,
    55
  )
  const criticalSchemeStatusAfterDays = Math.round(
    resolvePositiveNumber(runtimeConfig.ANALYTICS_SCHEME_STATUS_CRITICAL_AFTER_DAYS, 5)
  )
  const averagePersonsPerHousehold = resolvePositiveNumber(
    tenantPublicConfig?.averageMembersPerHousehold,
    defaultAverageMembersPerHousehold
  )
  const litersPerPersonPerDay = resolvePositiveNumber(
    tenantPublicConfig?.waterNorm,
    defaultWaterNormLitersPerPersonPerDay
  )
  const screenDateFormat = normalizeDateFormat(
    tenantPublicConfig?.dateFormatScreen?.dateFormat ?? DEFAULT_SCREEN_DATE_FORMAT
  )
  const tableDateFormat = normalizeDateFormat(
    tenantPublicConfig?.dateFormatTable?.dateFormat ?? DEFAULT_SCREEN_DATE_FORMAT
  )
  const hasResolvedTenantPublicConfig =
    !selectedTenant?.tenantId || (!isTenantPublicConfigLoading && !isTenantPublicConfigFetching)
  const shouldShowDepartmentMaps = tenantPublicConfig?.displayDepartmentMaps !== false
  const lgdMapLevelVisibility = tenantPublicConfig?.displayMapLgdLevels ?? [
    true,
    true,
    true,
    true,
    true,
    true,
  ]
  const currentLgdMapLevel = isVillageSelected
    ? 5
    : isGramPanchayatSelected
      ? 4
      : isBlockSelected
        ? 3
        : isDistrictSelected
          ? 2
          : 1
  const isLgdMapEnabledForCurrentLevel = lgdMapLevelVisibility[currentLgdMapLevel - 1] !== false
  const departmentMapLevelVisibility = tenantPublicConfig?.displayDepartmentMapLevels ?? [
    true,
    true,
    true,
    true,
    true,
    true,
  ]
  const currentDepartmentMapLevel = isDepartmentDivisionSelected
    ? 4
    : isDepartmentCircleSelected
      ? 3
      : isDepartmentZoneSelected
        ? 2
        : 1
  const isDepartmentMapEnabledForCurrentLevel =
    departmentMapLevelVisibility[currentDepartmentMapLevel - 1] !== false
  const shouldShowMapAlongsidePerformance =
    shouldShowDepartmentMaps &&
    (isDepartmentTabActive ? isDepartmentMapEnabledForCurrentLevel : isLgdMapEnabledForCurrentLevel)
  const shouldFetchTenantBoundaryGeoJson =
    hasResolvedTenantPublicConfig && shouldShowDepartmentMaps && shouldShowMapAlongsidePerformance

  return {
    averagePersonsPerHousehold,
    criticalSchemeStatusAfterDays,
    defaultAverageMembersPerHousehold,
    defaultWaterNormLitersPerPersonPerDay,
    litersPerPersonPerDay,
    screenDateFormat,
    selectedTenant,
    shouldFetchTenantBoundaryGeoJson,
    shouldShowMapAlongsidePerformance,
    tableDateFormat,
    tenantPublicConfig,
  }
}
