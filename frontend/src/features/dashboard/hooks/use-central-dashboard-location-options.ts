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
  const districtApiOptions = isRootStateLevel
    ? mapLocationOptions(districtLocationsData?.data)
    : rootLocationOptions
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
  const blockApiOptions = mapLocationOptions(blockLocationsData?.data)
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
  const gramPanchayatApiOptions = mapLocationOptions(gramPanchayatLocationsData?.data)
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
  const villageApiOptions = mapLocationOptions(villageLocationsData?.data)
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
    lgdAnalyticsParentId,
    tenantBoundaryLocationOptions,
    villageApiOptions,
  }
}
