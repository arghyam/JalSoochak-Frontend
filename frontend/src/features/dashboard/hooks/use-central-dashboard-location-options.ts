import { useLocationChildrenQuery } from '../services/query/use-location-children-query'
import type { StateUtOption } from '../types'
import {
  type LocationOption,
  findLocationOption,
  getStateLgdCode,
  mapLocationOptions,
  parseLocationId,
  resolveLgdAnalyticsParentId,
} from '../utils/central-dashboard-helpers'
import { type OnboardedPredicatesByLevel, everyRegionOnboarded } from '../utils/onboarded-regions'
import { useOnboardedChildrenPredicate } from './use-onboarded-children-predicate'
import { useOnboardedLocationOptions } from './use-onboarded-location-options'

type UseCentralDashboardLocationOptionsParams = {
  selectedTenant?: StateUtOption
  hierarchyType: 'LGD' | 'DEPARTMENT'
  activeHierarchySelectedState: string
  activeHierarchySelectedDistrict: string
  activeHierarchySelectedBlock: string
  activeHierarchySelectedGramPanchayat: string
  effectiveSelectedDistrict: string
  effectiveSelectedBlock: string
  effectiveSelectedGramPanchayat: string
  effectiveSelectedVillage: string
  selectedDepartmentVillage: string
  selectedDepartmentSubdivision: string
  selectedDepartmentDivision: string
  selectedDepartmentCircle: string
  selectedDepartmentZone: string
  effectiveSelectedDepartmentState: string
  isDepartmentTabActive: boolean
  isDepartmentStateSelected: boolean
  isDepartmentZoneSelected: boolean
  isDepartmentCircleSelected: boolean
  isDepartmentDivisionSelected: boolean
}

export function useCentralDashboardLocationOptions({
  selectedTenant,
  hierarchyType,
  activeHierarchySelectedState,
  activeHierarchySelectedDistrict,
  activeHierarchySelectedBlock,
  activeHierarchySelectedGramPanchayat,
  effectiveSelectedDistrict,
  effectiveSelectedBlock,
  effectiveSelectedGramPanchayat,
  effectiveSelectedVillage,
  selectedDepartmentVillage,
  selectedDepartmentSubdivision,
  selectedDepartmentDivision,
  selectedDepartmentCircle,
  selectedDepartmentZone,
  effectiveSelectedDepartmentState,
  isDepartmentTabActive,
  isDepartmentStateSelected,
  isDepartmentZoneSelected,
  isDepartmentCircleSelected,
  isDepartmentDivisionSelected,
}: UseCentralDashboardLocationOptionsParams) {
  const { data: rootLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId),
  })
  const rootLocationOptions = mapLocationOptions(rootLocationsData?.data)
  const selectedRootOption = findLocationOption(rootLocationOptions, activeHierarchySelectedState)
  const selectedStateLgdCode = getStateLgdCode(selectedTenant?.label, selectedTenant?.tenantCode)
  const selectedRootAnalyticsId =
    selectedRootOption === undefined
      ? activeHierarchySelectedState && rootLocationOptions.length > 0
        ? selectedStateLgdCode
        : undefined
      : (selectedRootOption.locationId ?? selectedStateLgdCode ?? selectedRootOption.analyticsId)
  const isRootStateLevel = Boolean(activeHierarchySelectedState) && Boolean(selectedRootOption)
  const districtParentId =
    isRootStateLevel && isDepartmentTabActive
      ? (parseLocationId(activeHierarchySelectedState) ?? selectedRootOption?.locationId)
      : isRootStateLevel
        ? selectedRootOption?.locationId
        : undefined

  const { data: districtLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: districtParentId,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId && districtParentId),
  })
  // Phased rollout: only onboarded children reach the analytics parent, map and table at
  // each level below the state.
  const { options: districtApiOptions, isOnboarded: isDistrictOnboarded } =
    useOnboardedLocationOptions({
      tenantId: selectedTenant?.tenantId,
      hierarchyType,
      parentId: districtParentId,
      options: isRootStateLevel
        ? mapLocationOptions(districtLocationsData?.data)
        : rootLocationOptions,
    })
  // When the root list doesn't hold the selected state, it stands in for the districts and
  // has no parent to ask about. Its options pass unfiltered, so map, table and URL follow suit
  // once it has loaded.
  const isDistrictLevelOnboarded =
    !isRootStateLevel && Boolean(activeHierarchySelectedState) && rootLocationsData !== undefined
      ? everyRegionOnboarded
      : isDistrictOnboarded
  const selectedDistrictOption = findLocationOption(
    districtApiOptions,
    activeHierarchySelectedDistrict
  )
  const selectedDistrictId =
    parseLocationId(activeHierarchySelectedDistrict) ?? selectedDistrictOption?.locationId

  const { data: blockLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: selectedDistrictId,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId && selectedDistrictId),
  })
  const { options: blockApiOptions, isOnboarded: isBlockOnboarded } = useOnboardedLocationOptions({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: selectedDistrictId,
    options: mapLocationOptions(blockLocationsData?.data),
  })
  const selectedBlockOption = findLocationOption(blockApiOptions, activeHierarchySelectedBlock)
  const selectedBlockId =
    parseLocationId(activeHierarchySelectedBlock) ?? selectedBlockOption?.locationId

  const { data: gramPanchayatLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: selectedBlockId,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId && selectedBlockId),
  })
  const { options: gramPanchayatApiOptions, isOnboarded: isGramPanchayatOnboarded } =
    useOnboardedLocationOptions({
      tenantId: selectedTenant?.tenantId,
      hierarchyType,
      parentId: selectedBlockId,
      options: mapLocationOptions(gramPanchayatLocationsData?.data),
    })
  const selectedGramPanchayatOption = findLocationOption(
    gramPanchayatApiOptions,
    activeHierarchySelectedGramPanchayat
  )
  const selectedGramPanchayatId =
    parseLocationId(activeHierarchySelectedGramPanchayat) ?? selectedGramPanchayatOption?.locationId

  const { data: villageLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: selectedGramPanchayatId,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId && selectedGramPanchayatId),
  })
  const { options: villageApiOptions, isOnboarded: isVillageOnboarded } =
    useOnboardedLocationOptions({
      tenantId: selectedTenant?.tenantId,
      hierarchyType,
      parentId: selectedGramPanchayatId,
      options: mapLocationOptions(villageLocationsData?.data),
    })
  const lgdAnalyticsParentId = resolveLgdAnalyticsParentId({
    selectedVillage: effectiveSelectedVillage,
    selectedGramPanchayat: effectiveSelectedGramPanchayat,
    selectedBlock: effectiveSelectedBlock,
    selectedDistrict: effectiveSelectedDistrict,
    villageOptions: villageApiOptions,
    gramPanchayatOptions: gramPanchayatApiOptions,
    blockOptions: blockApiOptions,
    districtOptions: districtApiOptions,
    rootAnalyticsId: selectedRootAnalyticsId,
  })
  const departmentAnalyticsParentId =
    parseLocationId(selectedDepartmentVillage) ??
    parseLocationId(selectedDepartmentSubdivision) ??
    parseLocationId(selectedDepartmentDivision) ??
    parseLocationId(selectedDepartmentCircle) ??
    parseLocationId(selectedDepartmentZone) ??
    parseLocationId(effectiveSelectedDepartmentState) ??
    (isDepartmentTabActive ? selectedRootOption?.locationId : undefined) ??
    0
  const analyticsParentId =
    hierarchyType === 'LGD' ? lgdAnalyticsParentId : departmentAnalyticsParentId
  // Department villages, the optional sixth level, have no dropdown, but a map or table click
  // can select one.
  const isDepartmentVillageOnboarded = useOnboardedChildrenPredicate({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId:
      hierarchyType === 'DEPARTMENT' ? parseLocationId(selectedDepartmentSubdivision) : undefined,
  })
  // The four option levels above are named after the LGD hierarchy but hold the active one.
  const isOnboardedByLevel: OnboardedPredicatesByLevel =
    hierarchyType === 'LGD'
      ? {
          district: isDistrictLevelOnboarded,
          block: isBlockOnboarded,
          gramPanchayat: isGramPanchayatOnboarded,
          village: isVillageOnboarded,
        }
      : {
          departmentZone: isDistrictLevelOnboarded,
          departmentCircle: isBlockOnboarded,
          departmentDivision: isGramPanchayatOnboarded,
          departmentSubdivision: isVillageOnboarded,
          departmentVillage: isDepartmentVillageOnboarded,
        }

  const tenantBoundaryLocationOptions: LocationOption[] = isDepartmentTabActive
    ? isDepartmentDivisionSelected
      ? villageApiOptions
      : isDepartmentCircleSelected
        ? gramPanchayatApiOptions
        : isDepartmentZoneSelected
          ? blockApiOptions
          : isDepartmentStateSelected
            ? districtApiOptions
            : []
    : []

  return {
    analyticsParentId,
    blockApiOptions,
    departmentAnalyticsParentId,
    districtApiOptions,
    gramPanchayatApiOptions,
    isOnboardedByLevel,
    lgdAnalyticsParentId,
    tenantBoundaryLocationOptions,
    villageApiOptions,
  }
}
