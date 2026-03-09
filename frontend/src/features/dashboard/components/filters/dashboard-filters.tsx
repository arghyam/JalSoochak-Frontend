import type { Dispatch, SetStateAction } from 'react'
import { Button, Flex, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { DateRangePicker } from '@/shared/components/common'
import type { DateRange, SearchableSelectOption } from '@/shared/components/common'
import { SearchLayout } from '@/shared/components/layout'
import { useLocationSearchQuery } from '../../services/query/use-location-search-query'
import { computeTrailIndices } from '../../utils/trail-index'

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

export function DashboardFilters(props: DashboardFiltersProps) {
  const { t } = useTranslation('dashboard')
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

  const { data: locationSearchData } = useLocationSearchQuery()
  const breadcrumbStateOptions = locationSearchData?.states ?? [
    { value: 'telangana', label: 'Telangana' },
  ]
  const totalStatesCount = locationSearchData?.totalStatesCount ?? 36
  const findLabel = (value: string, options: SearchableSelectOption[]): string | null => {
    if (!value) return null
    return options.find((option) => option.value === value)?.label ?? null
  }
  const selectionTrail = [
    findLabel(selectedState, breadcrumbStateOptions),
    findLabel(selectedDistrict, districtOptions),
    findLabel(selectedBlock, blockOptions),
    findLabel(selectedGramPanchayat, gramPanchayatOptions),
    findLabel(selectedVillage, villageOptions),
  ].filter((item): item is string => Boolean(item))

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
        options: villageOptions,
        label: t('filters.options.villages', 'Villages'),
        totalCount: villageOptions.length,
        noOptionsText: t('filters.noOptions.villages', 'No villages found'),
        onSelect: setSelectedVillage,
      }
    : hasSelectedBlock
      ? {
          options: gramPanchayatOptions,
          label: t('filters.options.gramPanchayats', 'Gram Panchayats'),
          totalCount: gramPanchayatOptions.length,
          noOptionsText: t('filters.noOptions.gramPanchayats', 'No gram panchayats found'),
          onSelect: onGramPanchayatChange,
        }
      : hasSelectedDistrict
        ? {
            options: blockOptions,
            label: t('filters.options.blocks', 'Blocks'),
            totalCount: blockOptions.length,
            noOptionsText: t('filters.noOptions.blocks', 'No blocks found'),
            onSelect: onBlockChange,
          }
        : hasSelectedState
          ? {
              options: districtOptions,
              label: t('filters.options.districts', 'Districts'),
              totalCount: districtOptions.length,
              noOptionsText: t('filters.noOptions.districts', 'No districts found'),
              onSelect: onDistrictChange,
            }
          : {
              options: breadcrumbStateOptions,
              label: t('filters.options.states', 'States'),
              totalCount: totalStatesCount,
              noOptionsText: t('filters.noOptions.states', 'No states found'),
              onSelect: onStateChange,
            }

  const handleTrailSelect = (trailIndex: number) => {
    if (trailIndex < 0) {
      onActiveTrailChange?.(-1)
      return
    }

    onActiveTrailChange?.(trailIndex)
  }

  return (
    <SearchLayout
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
        showTabs: true,
        tabsDisabled: !hasSelectedState,
        activeTab: filterTabIndex,
        onTabChange,
      }}
      filterSlot={
        <Flex align="center" gap={3} wrap="nowrap">
          <DateRangePicker
            value={selectedDuration}
            onChange={setSelectedDuration}
            placeholder={t('filters.duration', 'Duration')}
            width="160px"
            height="32px"
            borderRadius="4px"
            fontSize="sm"
            textColor="neutral.400"
            borderColor="neutral.400"
            disabled={false}
            isFilter={true}
          />
          <Button
            variant="link"
            size="sm"
            whiteSpace="nowrap"
            onClick={onClear}
            _hover={{ textDecoration: 'underline', textDecorationColor: 'neutral.300' }}
          >
            <Text textStyle="h10" fontWeight="600" color="neutral.300">
              {t('filters.clearAll', 'Clear all filters')}
            </Text>
          </Button>
        </Flex>
      }
    />
  )
}
