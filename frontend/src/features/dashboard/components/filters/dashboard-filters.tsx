import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Button, Flex, Text, useMediaQuery } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DateRangePicker } from '@/shared/components/common'
import type { DateRange, SearchableSelectOption } from '@/shared/components/common'
import { SearchLayout } from '@/shared/components/layout'
import { useLocationSearchQuery } from '../../services/query/use-location-search-query'
import { useLocationChildrenQuery } from '../../services/query/use-location-children-query'
import { useLocationHierarchyQuery } from '../../services/query/use-location-hierarchy-query'
import { locationSearchQueryKeys } from '../../services/query/location-search-query-keys'
import { computeTrailIndices } from '../../utils/trail-index'
import {
  sanitizeLocationLabel,
  slugify,
  toCapitalizedWords,
} from '../../utils/format-location-label'
import { toStableLocationValue } from '../../utils/stable-location-value'
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
  mockFilterStates: SearchableSelectOption[]
  mockFilterSchemes: SearchableSelectOption[]
  onStateChange: (value: string) => void
  onDistrictChange: (value: string) => void
  onBlockChange: (value: string) => void
  onGramPanchayatChange: (value: string) => void
  setSelectedVillage: Dispatch<SetStateAction<string>>
  setSelectedScheme: Dispatch<SetStateAction<string>>
  setSelectedDuration: Dispatch<SetStateAction<DateRange | null>>
  onDepartmentStateChange: (value: string) => void
  setSelectedDepartmentZone: Dispatch<SetStateAction<string>>
  setSelectedDepartmentCircle: Dispatch<SetStateAction<string>>
  setSelectedDepartmentDivision: Dispatch<SetStateAction<string>>
  setSelectedDepartmentSubdivision: Dispatch<SetStateAction<string>>
  setSelectedDepartmentVillage: Dispatch<SetStateAction<string>>
  onActiveTrailChange?: (trailIndex: number | null) => void
}

type LocationOption = SearchableSelectOption & {
  locationId?: number
  analyticsId?: number
}
const LOCATION_VALUE_SEPARATOR = ':'

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

  return locations.flatMap((location) => {
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
}

export function DashboardFilters(props: DashboardFiltersProps) {
  const { t } = useTranslation('dashboard')
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
  } = props

  const queryClient = useQueryClient()
  const [isBreadcrumbPanelOpen, setIsBreadcrumbPanelOpen] = useState(false)
  const { data: locationSearchData } = useLocationSearchQuery({
    enabled: isBreadcrumbPanelOpen,
  })
  const breadcrumbStateOptions = locationSearchData?.states ?? []
  const totalStatesCount = locationSearchData?.totalStatesCount ?? 0
  const selectedTenant = breadcrumbStateOptions.find((option) => option.value === selectedState)
  const hierarchyType: HierarchyType = filterTabIndex === 0 ? 'LGD' : 'DEPARTMENT'
  const { data: rootLocationsData } = useLocationChildrenQuery({
    tenantId: selectedTenant?.tenantId,
    hierarchyType,
    parentId: 0,
    tenantCode: selectedTenant?.tenantCode,
    enabled: Boolean(selectedTenant?.tenantId),
  })
  const rootLevelOptions = useMemo(
    () => mapLocationOptions(rootLocationsData?.data),
    [rootLocationsData?.data]
  )
  const selectedRootOption = findLocationOption(rootLevelOptions, selectedState)
  const isRootStateLevel = Boolean(selectedState) && Boolean(selectedRootOption)
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
  const selectedDistrictOption = findLocationOption(districtApiOptions, selectedDistrict)
  const selectedDistrictId = parseLocationId(selectedDistrict) ?? selectedDistrictOption?.locationId
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
  const selectedBlockOption = findLocationOption(blockApiOptions, selectedBlock)
  const selectedBlockId = parseLocationId(selectedBlock) ?? selectedBlockOption?.locationId
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
    selectedGramPanchayat
  )
  const selectedGramPanchayatId =
    parseLocationId(selectedGramPanchayat) ?? selectedGramPanchayatOption?.locationId
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
    const normalized = value.trim().toLowerCase()
    if (normalized === 'state') return 'States'
    if (normalized === 'district') return 'Districts'
    if (normalized === 'block') return 'Blocks'
    if (normalized === 'panchayat') return 'Panchayats'
    if (normalized === 'village') return 'Villages'
    if (normalized === 'sub division' || normalized === 'sub-division') return 'Sub-divisions'
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
    return (
      options.find((option) => option.value === value || slugify(option.label) === value)?.label ??
      null
    )
  }
  const selectionTrail = [
    findLabel(selectedState, breadcrumbStateOptions),
    findLabel(selectedDistrict, resolvedDistrictOptions),
    findLabel(selectedBlock, resolvedBlockOptions),
    findLabel(selectedGramPanchayat, resolvedGramPanchayatOptions),
    findLabel(selectedVillage, resolvedVillageOptions),
  ].filter((item): item is string => Boolean(item))
  const hasHierarchySelection = selectionTrail.length > 0
  const hasActiveFilters = hasHierarchySelection || Boolean(selectedDuration)
  const clearButtonHoverStyles = hasActiveFilters
    ? { textDecoration: 'underline', textDecorationColor: 'neutral.300' }
    : { textDecoration: 'none' }

  const trailSelectionValues = [
    selectedState,
    selectedDistrict,
    selectedBlock,
    selectedGramPanchayat,
    selectedVillage,
  ] as const
  const { effectiveTrailIndex } = computeTrailIndices(trailSelectionValues, activeTrailIndex)
  const hasSelectedState = effectiveTrailIndex >= 0 && Boolean(selectedState)
  const hasSelectedDistrict = effectiveTrailIndex >= 1 && Boolean(selectedDistrict)
  const hasSelectedBlock = effectiveTrailIndex >= 2 && Boolean(selectedBlock)
  const hasSelectedGramPanchayat = effectiveTrailIndex >= 3 && Boolean(selectedGramPanchayat)
  const breadcrumbPanelConfig = hasSelectedGramPanchayat
    ? {
        options: resolvedVillageOptions,
        label: villageLabel,
        totalCount: resolvedVillageOptions.length,
        noOptionsText: t('filters.noOptions.villages', {
          defaultValue: `No ${villageLabel.toLowerCase()} found`,
        }),
        onSelect: setSelectedVillage,
      }
    : hasSelectedBlock
      ? {
          options: resolvedGramPanchayatOptions,
          label: gramPanchayatLabel,
          totalCount: resolvedGramPanchayatOptions.length,
          noOptionsText: t('filters.noOptions.gramPanchayats', {
            defaultValue: `No ${gramPanchayatLabel.toLowerCase()} found`,
          }),
          onSelect: onGramPanchayatChange,
        }
      : hasSelectedDistrict
        ? {
            options: resolvedBlockOptions,
            label: blockLabel,
            totalCount: resolvedBlockOptions.length,
            noOptionsText: t('filters.noOptions.blocks', {
              defaultValue: `No ${blockLabel.toLowerCase()} found`,
            }),
            onSelect: onBlockChange,
          }
        : hasSelectedState
          ? {
              options: resolvedDistrictOptions,
              label: districtLabel,
              totalCount: resolvedDistrictOptions.length,
              noOptionsText: t('filters.noOptions.districts', {
                defaultValue: `No ${districtLabel.toLowerCase()} found`,
              }),
              onSelect: onDistrictChange,
            }
          : {
              options: breadcrumbStateOptions,
              label: stateLabel,
              totalCount: totalStatesCount,
              noOptionsText: t('filters.noOptions.states', {
                defaultValue: `No ${stateLabel.toLowerCase()} found`,
              }),
              onSelect: onStateChange,
            }

  const handleTrailSelect = (trailIndex: number) => {
    if (trailIndex < 0) {
      onActiveTrailChange?.(-1)
      return
    }

    onActiveTrailChange?.(trailIndex)
  }

  const handlePanelOpenChange = (isOpen: boolean) => {
    setIsBreadcrumbPanelOpen(isOpen)
    if (isOpen) {
      void queryClient.invalidateQueries({ queryKey: locationSearchQueryKeys.statesUts() })
    }
  }

  return (
    <SearchLayout
      actionLabel={
        isXsFilters
          ? t('searchLayout.download', 'Download')
          : t('searchLayout.downloadReport', 'Download Report')
      }
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
        closeOnOptionSelect: hasSelectedGramPanchayat,
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
              onClick={onClear}
              minW={0}
              isDisabled={!hasActiveFilters}
              _hover={clearButtonHoverStyles}
            >
              <Text textStyle="h10" fontWeight="600" color="neutral.300" fontSize="14px">
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
            popoverPlacement={isBelowLgFilters ? 'bottom-end' : 'bottom-start'}
          />
          {!isBelowLgFilters ? (
            <Button
              variant="link"
              size="sm"
              whiteSpace="nowrap"
              onClick={onClear}
              minW={0}
              isDisabled={!hasActiveFilters}
              _hover={clearButtonHoverStyles}
            >
              <Text
                textStyle="h10"
                fontWeight="600"
                color="neutral.300"
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
