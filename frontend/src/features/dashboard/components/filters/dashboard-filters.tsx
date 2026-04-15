import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Button, Flex, Text, useMediaQuery } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { DateRangePicker } from '@/shared/components/common'
import type { DateRange, SearchableSelectOption } from '@/shared/components/common'
import { SearchLayout } from '@/shared/components/layout'
import { useLocationSearchQuery } from '../../services/query/use-location-search-query'
import { useLocationChildrenQuery } from '../../services/query/use-location-children-query'
import { useLocationHierarchyQuery } from '../../services/query/use-location-hierarchy-query'
import { computeTrailIndices } from '../../utils/trail-index'
import {
  sanitizeLocationLabel,
  slugify,
  toCapitalizedWords,
} from '../../utils/format-location-label'
import { parseStableLocationValue, toStableLocationValue } from '../../utils/stable-location-value'
import {
  localizeDepartmentHierarchyLabel,
  normalizeHierarchyLabel,
} from '../../utils/hierarchy-label'
import type { HierarchyType } from '../../services/api/dashboard-api'
import type { TenantChildLocation } from '../../services/api/dashboard-api'

type DashboardFiltersProps = {
  filterTabIndex: number
  onTabChange: (index: number) => void
  onClear: () => void
  isAdvancedEnabled: boolean
  isDepartmentStateSelected: boolean
  emptyOptions: SearchableSelectOption[]
  selectedState: string
  selectedDistrict: string
  selectedBlock: string
  selectedGramPanchayat: string
  selectedVillage: string
  selectedScheme: string
  selectedDuration: DateRange | null
  durationDateFormat?: string
  selectedDepartmentState: string
  selectedDepartmentZone: string
  selectedDepartmentCircle: string
  selectedDepartmentDivision: string
  selectedDepartmentSubdivision: string
  selectedDepartmentVillage: string
  activeTrailIndex?: number | null
  districtOptions: SearchableSelectOption[]
  blockOptions: SearchableSelectOption[]
  gramPanchayatOptions: SearchableSelectOption[]
  villageOptions: SearchableSelectOption[]
  mockFilterStates?: SearchableSelectOption[]
  mockFilterSchemes?: SearchableSelectOption[]
  isSingleTenantMode?: boolean
  onStateChange: (value: string) => void
  onDistrictChange: (value: string) => void
  onBlockChange: (value: string) => void
  onGramPanchayatChange: (value: string) => void
  setSelectedVillage: Dispatch<SetStateAction<string>>
  setSelectedScheme: Dispatch<SetStateAction<string>>
  setSelectedDuration: Dispatch<SetStateAction<DateRange | null>>
  onDepartmentStateChange: (value: string) => void
  onDepartmentZoneChange?: (value: string) => void
  onDepartmentCircleChange?: (value: string) => void
  onDepartmentDivisionChange?: (value: string) => void
  onDepartmentSubdivisionChange?: (value: string) => void
  onDepartmentVillageChange?: (value: string) => void
  setSelectedDepartmentZone?: Dispatch<SetStateAction<string>>
  setSelectedDepartmentCircle?: Dispatch<SetStateAction<string>>
  setSelectedDepartmentDivision?: Dispatch<SetStateAction<string>>
  setSelectedDepartmentSubdivision?: Dispatch<SetStateAction<string>>
  setSelectedDepartmentVillage?: Dispatch<SetStateAction<string>>
  onActiveTrailChange?: (trailIndex: number | null) => void
}

type LocationOption = SearchableSelectOption & {
  locationId?: number
  analyticsId?: number
}
const LOCATION_VALUE_SEPARATOR = ':'
const sortByLabelAsc = <T extends { label: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))

const parseLocationId = (value: string): number | undefined => {
  if (!value) {
    return undefined
  }

  const idPrefix = value.split(LOCATION_VALUE_SEPARATOR, 1)[0]
  const parsedId = Number.parseInt(idPrefix, 10)
  return Number.isFinite(parsedId) ? parsedId : undefined
}

const findLocationOption = (
  options: LocationOption[],
  selectedValue: string
): LocationOption | undefined => {
  if (!selectedValue) {
    return undefined
  }

  const selectedId = parseLocationId(selectedValue)
  if (typeof selectedId === 'number') {
    return options.find((option) => option.locationId === selectedId)
  }

  return options.find(
    (option) => option.value === selectedValue || slugify(option.label) === selectedValue
  )
}

const mapLocationOptions = (locations: TenantChildLocation[] | undefined): LocationOption[] => {
  if (!locations?.length) {
    return []
  }

  const mappedOptions = locations.flatMap((location) => {
    if (typeof location.id !== 'number') {
      return []
    }

    const sanitizedTitle = sanitizeLocationLabel(location.title ?? '')
    const normalizedTitle = toCapitalizedWords(sanitizedTitle)
    if (!normalizedTitle) {
      return []
    }
    const slug = slugify(normalizedTitle)

    const locationId = location.id
    const analyticsId =
      typeof location.lgdCode === 'number' && Number.isFinite(location.lgdCode)
        ? location.lgdCode
        : locationId
    return {
      value: toStableLocationValue(locationId, analyticsId, slug),
      label: normalizedTitle,
      locationId,
      analyticsId,
    }
  })

  return sortByLabelAsc(mappedOptions)
}

export function DashboardFilters(props: DashboardFiltersProps) {
  const { t, i18n } = useTranslation('dashboard')
  const [isVeryCompactFilters] = useMediaQuery('(max-width: 569px)')
  const [isXsFilters] = useMediaQuery('(max-width: 479px)')
  const [isBelowLgFilters] = useMediaQuery('(max-width: 991.98px)')
  const {
    filterTabIndex,
    onTabChange,
    onClear,
    selectedState,
    selectedDistrict,
    selectedBlock,
    selectedGramPanchayat,
    selectedVillage,
    activeTrailIndex,
    selectedDuration,
    durationDateFormat,
    districtOptions,
    blockOptions,
    gramPanchayatOptions,
    villageOptions,
    onStateChange,
    onDistrictChange,
    onBlockChange,
    onGramPanchayatChange,
    setSelectedVillage,
    onActiveTrailChange,
    setSelectedDuration,
    selectedDepartmentState,
    selectedDepartmentZone,
    selectedDepartmentCircle,
    selectedDepartmentDivision,
    selectedDepartmentSubdivision,
    selectedDepartmentVillage,
    onDepartmentStateChange,
    onDepartmentZoneChange,
    onDepartmentCircleChange,
    onDepartmentDivisionChange,
    onDepartmentSubdivisionChange,
    onDepartmentVillageChange,
    setSelectedDepartmentZone,
    setSelectedDepartmentCircle,
    setSelectedDepartmentDivision,
    setSelectedDepartmentSubdivision,
    setSelectedDepartmentVillage,
    isSingleTenantMode = false,
  } = props

  const [isBreadcrumbPanelOpen, setIsBreadcrumbPanelOpen] = useState(false)
  const [manualSearchResetCounter, setManualSearchResetCounter] = useState(0)
  const { data: locationSearchData } = useLocationSearchQuery({
    enabled: isBreadcrumbPanelOpen,
  })
  const breadcrumbStateOptions = locationSearchData?.states ?? []
  const totalStatesCount = locationSearchData?.totalStatesCount ?? 0
  const hierarchyType: HierarchyType = filterTabIndex === 0 ? 'LGD' : 'DEPARTMENT'
  const isDepartmentTab = hierarchyType === 'DEPARTMENT'
  const activeSelectedState =
    isDepartmentTab && selectedDepartmentState ? selectedDepartmentState : selectedState
  const activeSelectedTenantValue =
    isDepartmentTab && selectedDepartmentState
      ? (parseStableLocationValue(selectedDepartmentState).lastSegment ?? selectedDepartmentState)
      : selectedState
  const selectedTenant = breadcrumbStateOptions.find(
    (option) => option.value === activeSelectedTenantValue
  )
  const activeSelectedDistrict = isDepartmentTab ? selectedDepartmentZone : selectedDistrict
  const activeSelectedBlock = isDepartmentTab ? selectedDepartmentCircle : selectedBlock
  const activeSelectedGramPanchayat = isDepartmentTab
    ? selectedDepartmentDivision
    : selectedGramPanchayat
  const activeSelectedVillage = isDepartmentTab
    ? selectedDepartmentSubdivision || selectedDepartmentVillage
    : selectedVillage
  const { data: rootLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId),
  })
  const rootLevelOptions = useMemo(
    () => mapLocationOptions(rootLocationsData?.data),
    [rootLocationsData?.data]
  )
  const selectedRootOption = findLocationOption(rootLevelOptions, activeSelectedState)
  const isRootStateLevel = Boolean(activeSelectedState) && Boolean(selectedRootOption)
  const districtParentId = isRootStateLevel ? selectedRootOption?.locationId : undefined
  const { data: districtLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: districtParentId,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId && districtParentId),
  })
  const districtApiOptions = useMemo(() => {
    if (isRootStateLevel) {
      return mapLocationOptions(districtLocationsData?.data)
    }

    // Some tenants return districts directly at parentId=0 instead of returning state first.
    return rootLevelOptions
  }, [districtLocationsData?.data, isRootStateLevel, rootLevelOptions])
  const selectedDistrictOption = findLocationOption(districtApiOptions, activeSelectedDistrict)
  const selectedDistrictId =
    parseLocationId(activeSelectedDistrict) ?? selectedDistrictOption?.locationId
  const { data: blockLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: selectedDistrictId,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId && selectedDistrictId),
  })
  const blockApiOptions = useMemo(
    () => mapLocationOptions(blockLocationsData?.data),
    [blockLocationsData?.data]
  )
  const selectedBlockOption = findLocationOption(blockApiOptions, activeSelectedBlock)
  const selectedBlockId = parseLocationId(activeSelectedBlock) ?? selectedBlockOption?.locationId
  const { data: gramPanchayatLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: selectedBlockId,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId && selectedBlockId),
  })
  const gramPanchayatApiOptions = useMemo(
    () => mapLocationOptions(gramPanchayatLocationsData?.data),
    [gramPanchayatLocationsData?.data]
  )
  const selectedGramPanchayatOption = findLocationOption(
    gramPanchayatApiOptions,
    activeSelectedGramPanchayat
  )
  const selectedGramPanchayatId =
    parseLocationId(activeSelectedGramPanchayat) ?? selectedGramPanchayatOption?.locationId
  const { data: villageLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: selectedGramPanchayatId,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId && selectedGramPanchayatId),
  })
  const villageApiOptions = useMemo(
    () => mapLocationOptions(villageLocationsData?.data),
    [villageLocationsData?.data]
  )
  const hasSelectedTenant = Boolean(selectedTenant?.tenantId)
  const resolvedDistrictOptions = hasSelectedTenant
    ? districtApiOptions
    : districtApiOptions.length > 0
      ? districtApiOptions
      : districtOptions
  const resolvedBlockOptions = hasSelectedTenant
    ? blockApiOptions
    : blockApiOptions.length > 0
      ? blockApiOptions
      : blockOptions
  const resolvedGramPanchayatOptions = hasSelectedTenant
    ? gramPanchayatApiOptions
    : gramPanchayatApiOptions.length > 0
      ? gramPanchayatApiOptions
      : gramPanchayatOptions
  const resolvedVillageOptions = hasSelectedTenant
    ? villageApiOptions
    : villageApiOptions.length > 0
      ? villageApiOptions
      : villageOptions
  const { data: locationHierarchyData } = useLocationHierarchyQuery({
    tenantId: selectedTenant?.tenantId,
    tenantCode: selectedTenant?.tenantCode,
    hierarchyType,
    enabled: Boolean(selectedTenant?.tenantId),
  })
  const hierarchyLevels = locationHierarchyData?.data?.levels ?? []
  const hierarchyLabelByLevel = hierarchyLevels.reduce<Record<number, string>>((acc, item) => {
    const levelNumber = typeof item.level === 'number' ? item.level : undefined
    const levelTitle = toCapitalizedWords(item.levelName?.[0]?.title?.trim() ?? '')
    if (!levelNumber || !levelTitle) {
      return acc
    }
    acc[levelNumber] = levelTitle
    return acc
  }, {})
  const toPluralLabel = (value: string): string => {
    const localized = localizeDepartmentHierarchyLabel(value, 'plural', i18n, t)
    if (localized !== value) {
      return localized
    }
    const normalized = normalizeHierarchyLabel(value)
    if (normalized === 'state') return 'States'
    if (normalized === 'district') return 'Districts'
    if (normalized === 'block') return 'Blocks'
    if (normalized === 'panchayat') return 'Panchayats'
    if (normalized === 'village') return 'Villages'
    if (normalized === 'sub division' || normalized === 'subdivision') return 'Sub Divisions'
    if (value.endsWith('s')) return value
    return `${value}s`
  }
  const stateLabel = toPluralLabel(
    hierarchyLabelByLevel[1] ?? t('filters.options.states', 'States')
  )
  const districtLabel = toPluralLabel(
    hierarchyLabelByLevel[2] ?? t('filters.options.districts', 'Districts')
  )
  const blockLabel = toPluralLabel(
    hierarchyLabelByLevel[3] ?? t('filters.options.blocks', 'Blocks')
  )
  const gramPanchayatLabel = toPluralLabel(
    hierarchyLabelByLevel[4] ?? t('filters.options.gramPanchayats', 'Gram Panchayats')
  )
  const villageLabel = toPluralLabel(
    hierarchyLabelByLevel[5] ?? t('filters.options.villages', 'Villages')
  )
  const findLabel = (value: string, options: SearchableSelectOption[]): string | null => {
    if (!value) return null
    const selectedId = parseLocationId(value)
    return (
      options.find((option) => {
        if (option.value === value || slugify(option.label) === value) {
          return true
        }

        if (typeof selectedId === 'number') {
          return parseLocationId(option.value) === selectedId
        }

        return false
      })?.label ?? null
    )
  }
  const selectionTrail = [
    findLabel(activeSelectedState, breadcrumbStateOptions),
    findLabel(activeSelectedDistrict, resolvedDistrictOptions),
    findLabel(activeSelectedBlock, resolvedBlockOptions),
    findLabel(activeSelectedGramPanchayat, resolvedGramPanchayatOptions),
    findLabel(activeSelectedVillage, resolvedVillageOptions),
  ].filter((item): item is string => Boolean(item))
  const selectionResetKey = [
    filterTabIndex,
    activeSelectedState,
    activeSelectedDistrict,
    activeSelectedBlock,
    activeSelectedGramPanchayat,
    activeSelectedVillage,
  ].join('|')
  const searchResetTrigger = `${selectionResetKey}|manual:${manualSearchResetCounter}`

  const hasHierarchySelection = selectionTrail.length > 0
  const hasActiveFilters = hasHierarchySelection || Boolean(selectedDuration)
  const clearButtonHoverStyles = hasActiveFilters
    ? { textDecoration: 'underline', textDecorationColor: 'neutral.400' }
    : { textDecoration: 'none' }

  const trailSelectionValues = [
    activeSelectedState,
    activeSelectedDistrict,
    activeSelectedBlock,
    activeSelectedGramPanchayat,
    activeSelectedVillage,
  ] as const
  const { effectiveTrailIndex } = computeTrailIndices(
    trailSelectionValues,
    isDepartmentTab ? null : activeTrailIndex
  )
  const hasSelectedState = effectiveTrailIndex >= 0 && Boolean(activeSelectedState)
  const hasSelectedDistrict = effectiveTrailIndex >= 1 && Boolean(activeSelectedDistrict)
  const hasSelectedBlock = effectiveTrailIndex >= 2 && Boolean(activeSelectedBlock)
  const hasSelectedGramPanchayat = effectiveTrailIndex >= 3 && Boolean(activeSelectedGramPanchayat)
  const searchByLabel = (() => {
    if (isDepartmentTab) {
      if (hasSelectedGramPanchayat) return t('filters.searchBy.subDivision', 'Sub Division')
      if (hasSelectedBlock) return t('filters.searchBy.division', 'Division')
      if (hasSelectedDistrict) return t('filters.searchBy.circle', 'Circle')
      if (hasSelectedState) return t('filters.searchBy.zone', 'Zone')
      return t('filters.searchBy.stateUt', 'State/UT')
    }

    if (hasSelectedGramPanchayat) return t('filters.searchBy.village', 'Village')
    if (hasSelectedBlock) return t('filters.searchBy.gramPanchayat', 'Gram Panchayat')
    if (hasSelectedDistrict) return t('filters.searchBy.block', 'Block')
    if (hasSelectedState) return t('filters.searchBy.district', 'District')
    return t('filters.searchBy.stateUt', 'State/UT')
  })()
  const dynamicSearchPlaceholder = t('filters.searchBy.label', {
    label: searchByLabel,
    defaultValue: `Search by ${searchByLabel}`,
  })
  const getNoOptionsText = (label: string): string =>
    t('searchLayout.noOptionsFound', {
      label: label.toLowerCase(),
      defaultValue: `No ${label.toLowerCase()} found`,
    })

  // In single-tenant mode, prevent state changes (users cannot select a different state/tenant)
  const wrappedOnStateChange = isSingleTenantMode ? () => {} : onStateChange
  const wrappedOnDepartmentStateChange = isSingleTenantMode ? () => {} : onDepartmentStateChange

  const rootSelectionHandler = isDepartmentTab
    ? wrappedOnDepartmentStateChange
    : wrappedOnStateChange
  const districtSelectionHandler = isDepartmentTab
    ? (onDepartmentZoneChange ??
      ((value: string) => {
        setSelectedDepartmentZone?.(value)
        setSelectedDepartmentCircle?.('')
        setSelectedDepartmentDivision?.('')
        setSelectedDepartmentSubdivision?.('')
        setSelectedDepartmentVillage?.('')
      }))
    : onDistrictChange
  const blockSelectionHandler = isDepartmentTab
    ? (onDepartmentCircleChange ??
      ((value: string) => {
        setSelectedDepartmentCircle?.(value)
        setSelectedDepartmentDivision?.('')
        setSelectedDepartmentSubdivision?.('')
        setSelectedDepartmentVillage?.('')
      }))
    : onBlockChange
  const gramPanchayatSelectionHandler = isDepartmentTab
    ? (onDepartmentDivisionChange ??
      ((value: string) => {
        setSelectedDepartmentDivision?.(value)
        setSelectedDepartmentSubdivision?.('')
        setSelectedDepartmentVillage?.('')
      }))
    : onGramPanchayatChange
  const villageSelectionHandler = isDepartmentTab
    ? (onDepartmentSubdivisionChange ??
      onDepartmentVillageChange ??
      ((value: string) => {
        setSelectedDepartmentSubdivision?.(value)
        setSelectedDepartmentVillage?.('')
      }))
    : setSelectedVillage
  const breadcrumbPanelConfig = hasSelectedGramPanchayat
    ? {
        options: resolvedVillageOptions,
        label: villageLabel,
        totalCount: resolvedVillageOptions.length,
        noOptionsText: getNoOptionsText(villageLabel),
        onSelect: villageSelectionHandler,
      }
    : hasSelectedBlock
      ? {
          options: resolvedGramPanchayatOptions,
          label: gramPanchayatLabel,
          totalCount: resolvedGramPanchayatOptions.length,
          noOptionsText: getNoOptionsText(gramPanchayatLabel),
          onSelect: gramPanchayatSelectionHandler,
        }
      : hasSelectedDistrict
        ? {
            options: resolvedBlockOptions,
            label: blockLabel,
            totalCount: resolvedBlockOptions.length,
            noOptionsText: getNoOptionsText(blockLabel),
            onSelect: blockSelectionHandler,
          }
        : hasSelectedState
          ? {
              options: resolvedDistrictOptions,
              label: districtLabel,
              totalCount: resolvedDistrictOptions.length,
              noOptionsText: getNoOptionsText(districtLabel),
              onSelect: districtSelectionHandler,
            }
          : {
              options: breadcrumbStateOptions,
              label: stateLabel,
              totalCount: totalStatesCount,
              noOptionsText: getNoOptionsText(stateLabel),
              onSelect: rootSelectionHandler,
            }

  const handleTrailSelect = (trailIndex: number) => {
    if (isDepartmentTab) {
      if (trailIndex < 0) {
        onDepartmentStateChange('')
        return
      }

      if (trailIndex === 0) {
        districtSelectionHandler('')
        return
      }

      if (trailIndex === 1) {
        blockSelectionHandler('')
        return
      }

      if (trailIndex === 2) {
        gramPanchayatSelectionHandler('')
        return
      }

      if (trailIndex === 3) {
        villageSelectionHandler('')
        return
      }

      return
    }

    if (trailIndex < 0) {
      rootSelectionHandler('')
      return
    }

    if (trailIndex === 0) {
      rootSelectionHandler(activeSelectedState)
      return
    }

    if (trailIndex === 1) {
      districtSelectionHandler(activeSelectedDistrict)
      return
    }

    if (trailIndex === 2) {
      blockSelectionHandler(activeSelectedBlock)
      return
    }

    if (trailIndex === 3) {
      gramPanchayatSelectionHandler(activeSelectedGramPanchayat)
      return
    }

    if (trailIndex === 4) {
      if (activeSelectedVillage === selectedVillage) {
        onActiveTrailChange?.(trailIndex)
        return
      }

      villageSelectionHandler(activeSelectedVillage)
      return
    }

    onActiveTrailChange?.(trailIndex)
  }

  const handlePanelOpenChange = (isOpen: boolean) => {
    setIsBreadcrumbPanelOpen(isOpen)
  }
  const handleClear = () => {
    setManualSearchResetCounter((value) => value + 1)
    onClear()
  }

  return (
    <SearchLayout
      placeholder={dynamicSearchPlaceholder}
      resetSearchTrigger={searchResetTrigger}
      hideActionButton={true}
      selectionTrail={selectionTrail}
      activeTrailIndex={effectiveTrailIndex}
      breadcrumbPanelProps={{
        stateOptions: breadcrumbStateOptions,
        totalStatesCount,
        options: breadcrumbPanelConfig.options,
        optionsLabel: breadcrumbPanelConfig.label,
        totalOptionsCount: breadcrumbPanelConfig.totalCount,
        noOptionsText: breadcrumbPanelConfig.noOptionsText,
        onOptionSelect: breadcrumbPanelConfig.onSelect,
        closeOnOptionSelect: true,
        onTrailSelect: handleTrailSelect,
        onPanelOpenChange: handlePanelOpenChange,
        showTabs: true,
        tabsDisabled: !hasSelectedState,
        activeTab: filterTabIndex,
        onTabChange,
      }}
      closedTrailSlot={
        isBelowLgFilters && hasActiveFilters ? (
          <Flex w="full" justify="flex-end">
            <Button
              variant="link"
              size="sm"
              whiteSpace="nowrap"
              onClick={handleClear}
              minW={0}
              isDisabled={!hasActiveFilters}
              _hover={clearButtonHoverStyles}
            >
              <Text textStyle="h10" fontWeight="600" color="neutral.500" fontSize="14px">
                {t('filters.clear', 'Clear')}
              </Text>
            </Button>
          </Flex>
        ) : null
      }
      filterSlot={
        <Flex align="center" gap={{ base: 2, lg: 3 }} wrap="nowrap" minW={0}>
          <DateRangePicker
            value={selectedDuration}
            onChange={setSelectedDuration}
            dateFormat={durationDateFormat}
            placeholder={t('filters.duration', 'Duration')}
            width={isBelowLgFilters ? '32px' : '160px'}
            height="32px"
            borderRadius="4px"
            fontSize={isVeryCompactFilters ? '11px' : 'sm'}
            textColor="neutral.400"
            borderColor="neutral.400"
            disabled={false}
            isFilter={true}
            iconOnly={isBelowLgFilters}
            iconAriaLabel={t('filters.duration', 'Duration')}
            popoverPlacement="bottom-end"
          />
          {!isBelowLgFilters ? (
            <Button
              variant="link"
              size="sm"
              whiteSpace="nowrap"
              onClick={handleClear}
              minW={0}
              isDisabled={!hasActiveFilters}
              _hover={clearButtonHoverStyles}
            >
              <Text
                textStyle="h10"
                fontWeight="600"
                color="neutral.500"
                fontSize={isVeryCompactFilters ? '11px' : '14px'}
              >
                {isXsFilters
                  ? t('filters.clear', 'Clear')
                  : t('filters.clearAll', 'Clear all filters')}
              </Text>
            </Button>
          ) : null}
        </Flex>
      }
    />
  )
}
