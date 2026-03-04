import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, Flex, Text, Heading, Grid, Icon, Image, Avatar } from '@chakra-ui/react'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { KPICard } from './kpi-card'
import { DashboardBody } from './screens/dashboard-body'
import { IndiaMapChart } from './charts'
import { LoadingSpinner } from '@/shared/components/common'
import { MdOutlineWaterDrop, MdArrowUpward, MdArrowDownward } from 'react-icons/md'
import { AiOutlineInfoCircle } from 'react-icons/ai'
import { LuClock3 } from 'react-icons/lu'
import waterTapIcon from '@/assets/media/water-tap_1822589 1.svg'
import type { DateRange, SearchableSelectOption } from '@/shared/components/common'
import type { EntityPerformance } from '../types'
import { DashboardFilters } from './filters/dashboard-filters'
import { AllStatesTable } from './tables'
import { ROUTES } from '@/shared/constants/routes'
import { computeTrailIndices } from '../utils/trail-index'
import {
  mockFilterStates,
  mockFilterDistricts,
  mockFilterBlocks,
  mockFilterGramPanchayats,
  mockFilterVillages,
  mockFilterSchemes,
  mockDistrictPerformanceByState,
  mockBlockPerformanceByDistrict,
  mockGramPanchayatPerformanceByBlock,
  mockVillagePerformanceByGramPanchayat,
} from '../services/mock/dashboard-mock'

const storageKey = 'central-dashboard-filters'

type StoredFilters = {
  selectedDuration?: DateRange
  selectedScheme?: string
  selectedDepartmentState?: string
  selectedDepartmentZone?: string
  selectedDepartmentCircle?: string
  selectedDepartmentDivision?: string
  selectedDepartmentSubdivision?: string
  selectedDepartmentVillage?: string
  filterTabIndex?: number
}

const getOwnLookupValue = <T,>(record: Record<string, T>, key: string, fallback: T): T => {
  if (Object.prototype.hasOwnProperty.call(record, key)) {
    return record[key] as T
  }

  return fallback
}

const getStoredFilters = (): StoredFilters => {
  if (typeof window === 'undefined') return {}
  try {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return {}
    const parsed = JSON.parse(saved) as StoredFilters
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // Ignore storage errors (quota/private mode)
    }
    return {}
  }
}

const toStateSlug = (stateName: string) =>
  stateName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function CentralDashboard() {
  const { stateSlug = '' } = useParams<{ stateSlug?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useDashboardData('central')
  const [storedFilters] = useState(() => getStoredFilters())
  const initialDuration =
    storedFilters.selectedDuration &&
    typeof storedFilters.selectedDuration === 'object' &&
    'startDate' in storedFilters.selectedDuration &&
    'endDate' in storedFilters.selectedDuration
      ? storedFilters.selectedDuration
      : null
  const selectedState = stateSlug
  const selectedDistrict = selectedState ? (searchParams.get('district') ?? '') : ''
  const selectedBlock = selectedDistrict ? (searchParams.get('block') ?? '') : ''
  const selectedGramPanchayat = selectedBlock ? (searchParams.get('gramPanchayat') ?? '') : ''
  const selectedVillage = selectedGramPanchayat ? (searchParams.get('village') ?? '') : ''
  const [selectedDuration, setSelectedDuration] = useState<DateRange | null>(initialDuration)
  const [selectedScheme, setSelectedScheme] = useState(storedFilters.selectedScheme ?? '')
  const [selectedDepartmentState, setSelectedDepartmentState] = useState(
    storedFilters.selectedDepartmentState ?? ''
  )
  const [selectedDepartmentZone, setSelectedDepartmentZone] = useState(
    storedFilters.selectedDepartmentZone ?? ''
  )
  const [selectedDepartmentCircle, setSelectedDepartmentCircle] = useState(
    storedFilters.selectedDepartmentCircle ?? ''
  )
  const [selectedDepartmentDivision, setSelectedDepartmentDivision] = useState(
    storedFilters.selectedDepartmentDivision ?? ''
  )
  const [selectedDepartmentSubdivision, setSelectedDepartmentSubdivision] = useState(
    storedFilters.selectedDepartmentSubdivision ?? ''
  )
  const [selectedDepartmentVillage, setSelectedDepartmentVillage] = useState(
    storedFilters.selectedDepartmentVillage ?? ''
  )
  const [filterTabIndex, setFilterTabIndex] = useState(
    typeof storedFilters.filterTabIndex === 'number' ? storedFilters.filterTabIndex : 0
  )
  const [activeTrailIndex, setActiveTrailIndex] = useState<number | null>(null)
  const selectionTrailValues = [
    selectedState,
    selectedDistrict,
    selectedBlock,
    selectedGramPanchayat,
    selectedVillage,
  ] as const
  const { effectiveTrailIndex } = computeTrailIndices(selectionTrailValues, activeTrailIndex)
  const effectiveSelectedState = effectiveTrailIndex >= 0 ? selectedState : ''
  const effectiveSelectedDistrict = effectiveTrailIndex >= 1 ? selectedDistrict : ''
  const effectiveSelectedBlock = effectiveTrailIndex >= 2 ? selectedBlock : ''
  const effectiveSelectedGramPanchayat = effectiveTrailIndex >= 3 ? selectedGramPanchayat : ''
  const effectiveSelectedVillage = effectiveTrailIndex >= 4 ? selectedVillage : ''
  const isStateSelected = Boolean(effectiveSelectedState)
  const isDistrictSelected = Boolean(effectiveSelectedDistrict)
  const isBlockSelected = Boolean(effectiveSelectedBlock)
  const isGramPanchayatSelected = Boolean(effectiveSelectedGramPanchayat)
  const isVillageSelected = Boolean(effectiveSelectedVillage)
  const isDepartmentStateSelected = Boolean(selectedDepartmentState)
  const emptyOptions: SearchableSelectOption[] = []
  const isAdvancedEnabled = Boolean(selectedState && selectedDistrict)
  const emptyEntityPerformance: EntityPerformance[] = []
  const districtTableData = getOwnLookupValue(
    mockDistrictPerformanceByState,
    effectiveSelectedState,
    emptyEntityPerformance
  )
  const blockTableData = getOwnLookupValue(
    mockBlockPerformanceByDistrict,
    effectiveSelectedDistrict,
    emptyEntityPerformance
  )
  const gramPanchayatTableData = getOwnLookupValue(
    mockGramPanchayatPerformanceByBlock,
    effectiveSelectedBlock,
    emptyEntityPerformance
  )
  const villageTableData = getOwnLookupValue(
    mockVillagePerformanceByGramPanchayat,
    effectiveSelectedGramPanchayat,
    emptyEntityPerformance
  )
  const supplySubmissionRateData = isGramPanchayatSelected
    ? villageTableData
    : isBlockSelected
      ? gramPanchayatTableData
      : isDistrictSelected
        ? blockTableData
        : isStateSelected
          ? districtTableData
          : (data?.mapData ?? ([] as EntityPerformance[]))
  const supplySubmissionRateLabel = isGramPanchayatSelected
    ? 'Villages'
    : isBlockSelected
      ? 'Gram Panchayats'
      : isDistrictSelected
        ? 'Blocks'
        : isStateSelected
          ? 'Districts'
          : 'States/UTs'
  const overallPerformanceTableData = isGramPanchayatSelected
    ? villageTableData
    : isBlockSelected
      ? gramPanchayatTableData
      : isDistrictSelected
        ? blockTableData
        : isStateSelected
          ? districtTableData
          : (data?.mapData ?? emptyEntityPerformance)
  const overallPerformanceEntityLabel = isGramPanchayatSelected
    ? 'Village'
    : isBlockSelected
      ? 'Gram Panchayat'
      : isDistrictSelected
        ? 'Block'
        : isStateSelected
          ? 'District'
          : 'State/UT'
  const districtOptions = selectedState
    ? getOwnLookupValue(mockFilterDistricts, selectedState, emptyOptions)
    : emptyOptions
  const blockOptions = selectedDistrict
    ? getOwnLookupValue(mockFilterBlocks, selectedDistrict, emptyOptions)
    : emptyOptions
  const gramPanchayatOptions = selectedBlock
    ? getOwnLookupValue(mockFilterGramPanchayats, selectedBlock, emptyOptions)
    : emptyOptions
  const villageOptions = selectedGramPanchayat
    ? getOwnLookupValue(mockFilterVillages, selectedGramPanchayat, emptyOptions)
    : emptyOptions

  const updateFilterUrl = (filters: {
    state?: string
    district?: string
    block?: string
    gramPanchayat?: string
    village?: string
  }) => {
    const nextState = filters.state ?? ''
    const nextPath = nextState ? `/${encodeURIComponent(nextState)}` : ROUTES.DASHBOARD
    const nextSearchParams = new URLSearchParams()

    if (filters.district) {
      nextSearchParams.set('district', filters.district)
    }
    if (filters.block) {
      nextSearchParams.set('block', filters.block)
    }
    if (filters.gramPanchayat) {
      nextSearchParams.set('gramPanchayat', filters.gramPanchayat)
    }
    if (filters.village) {
      nextSearchParams.set('village', filters.village)
    }

    const nextSearch = nextSearchParams.toString()
    navigate({
      pathname: nextPath,
      search: nextSearch ? `?${nextSearch}` : '',
    })
  }

  const handleStateChange = (value: string) => {
    setActiveTrailIndex(null)
    setFilterTabIndex(0)
    updateFilterUrl({ state: value })
  }
  const handleDistrictChange = (value: string) => {
    setActiveTrailIndex(null)
    updateFilterUrl({ state: selectedState, district: value })
  }
  const handleBlockChange = (value: string) => {
    setActiveTrailIndex(null)
    updateFilterUrl({
      state: selectedState,
      district: selectedDistrict,
      block: value,
    })
  }
  const handleGramPanchayatChange = (value: string) => {
    setActiveTrailIndex(null)
    updateFilterUrl({
      state: selectedState,
      district: selectedDistrict,
      block: selectedBlock,
      gramPanchayat: value,
    })
  }
  const handleVillageChange: Dispatch<SetStateAction<string>> = (value) => {
    setActiveTrailIndex(null)
    const nextVillage = typeof value === 'function' ? value(selectedVillage) : value
    updateFilterUrl({
      state: selectedState,
      district: selectedDistrict,
      block: selectedBlock,
      gramPanchayat: selectedGramPanchayat,
      village: nextVillage,
    })
  }
  const handleDepartmentStateChange = (value: string) => {
    setSelectedDepartmentState(value)
    setSelectedDepartmentZone('')
    setSelectedDepartmentCircle('')
    setSelectedDepartmentDivision('')
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
  }
  const handleClearFilters = () => {
    setActiveTrailIndex(null)
    setFilterTabIndex(0)
    updateFilterUrl({ state: '' })
    setSelectedDuration(null)
    setSelectedScheme('')
    setSelectedDepartmentState('')
    setSelectedDepartmentZone('')
    setSelectedDepartmentCircle('')
    setSelectedDepartmentDivision('')
    setSelectedDepartmentSubdivision('')
    setSelectedDepartmentVillage('')
  }

  useEffect(() => {
    const payload = {
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedGramPanchayat,
      selectedVillage,
      selectedDuration,
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
      localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch {
      // Ignore storage errors (quota/private mode)
    }
  }, [
    filterTabIndex,
    selectedBlock,
    selectedDistrict,
    selectedDuration,
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
  ])

  const handleStateClick = (_stateId: string, stateName: string) => {
    setActiveTrailIndex(null)
    setFilterTabIndex(0)
    const stateOption = mockFilterStates.find(
      (option) => option.label.toLowerCase() === stateName.toLowerCase()
    )
    updateFilterUrl({ state: stateOption?.value ?? toStateSlug(stateName) })
  }

  const handleStateHover = (_stateId: string, _stateName: string, _metrics: unknown) => {
    // Hover tooltip is handled by ECharts
  }

  if (isLoading) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <LoadingSpinner />
      </Flex>
    )
  }

  if (error) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Box textAlign="center">
          <Heading fontSize="2xl" fontWeight="bold" color="red.600">
            Error loading dashboard
          </Heading>
          <Text mt={2} color="gray.600">
            {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
        </Box>
      </Flex>
    )
  }

  if (!data) return null

  if (
    !data.kpis ||
    !data.mapData ||
    !data.demandSupply ||
    !data.imageSubmissionStatus ||
    !data.pumpOperators ||
    !data.photoEvidenceCompliance ||
    !data.waterSupplyOutages ||
    !data.topPerformers ||
    !data.worstPerformers ||
    !data.regularityData ||
    !data.continuityData
  ) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Box textAlign="center">
          <Heading fontSize="2xl" fontWeight="bold" color="red.600">
            Invalid data structure
          </Heading>
          <Text mt={2} color="gray.600">
            Dashboard data is incomplete
          </Text>
        </Box>
      </Flex>
    )
  }

  const waterSupplyOutagesData = isGramPanchayatSelected
    ? getOwnLookupValue(
        mockVillagePerformanceByGramPanchayat,
        effectiveSelectedGramPanchayat,
        emptyEntityPerformance
      ).map((village, index) => {
        if (data.waterSupplyOutages.length === 0) {
          return {
            label: village.name,
            electricityFailure: 0,
            pipelineLeak: 0,
            pumpFailure: 0,
            valveIssue: 0,
            sourceDrying: 0,
          }
        }
        const source = data.waterSupplyOutages[index % data.waterSupplyOutages.length]
        return { ...source, label: village.name }
      })
    : isBlockSelected
      ? getOwnLookupValue(
          mockGramPanchayatPerformanceByBlock,
          effectiveSelectedBlock,
          emptyEntityPerformance
        ).map((gramPanchayat, index) => {
          if (data.waterSupplyOutages.length === 0) {
            return {
              label: gramPanchayat.name,
              electricityFailure: 0,
              pipelineLeak: 0,
              pumpFailure: 0,
              valveIssue: 0,
              sourceDrying: 0,
            }
          }
          const source = data.waterSupplyOutages[index % data.waterSupplyOutages.length]
          return { ...source, label: gramPanchayat.name }
        })
      : isDistrictSelected
        ? getOwnLookupValue(
            mockBlockPerformanceByDistrict,
            effectiveSelectedDistrict,
            emptyEntityPerformance
          ).map((block, index) => {
            if (data.waterSupplyOutages.length === 0) {
              return {
                label: block.name,
                electricityFailure: 0,
                pipelineLeak: 0,
                pumpFailure: 0,
                valveIssue: 0,
                sourceDrying: 0,
              }
            }
            const source = data.waterSupplyOutages[index % data.waterSupplyOutages.length]
            return { ...source, label: block.name }
          })
        : isStateSelected
          ? districtTableData.map((district, index) => {
              if (data.waterSupplyOutages.length === 0) {
                return {
                  label: district.name,
                  electricityFailure: 0,
                  pipelineLeak: 0,
                  pumpFailure: 0,
                  valveIssue: 0,
                  sourceDrying: 0,
                }
              }
              const source = data.waterSupplyOutages[index % data.waterSupplyOutages.length]
              return { ...source, label: district.name }
            })
          : data.waterSupplyOutages

  const coreMetrics = [
    {
      label: 'Quantity in MLD',
      value: '36,20,012',
      trend: { direction: 'down', text: '-3% vs last 30 days' },
      icon: (
        <Flex w="44px" h="44px" borderRadius="100px" bg="#E6F7EC" align="center" justify="center">
          <Image src={waterTapIcon} alt="" boxSize="24px" />
        </Flex>
      ),
    },
    {
      label: 'Quantity in LPCD',
      value: '55',
      trend: { direction: 'up', text: '+2 LPCD vs last month' },
      icon: (
        <Flex w="44px" h="44px" borderRadius="100px" bg="#EAF2FA" align="center" justify="center">
          <Icon as={MdOutlineWaterDrop} boxSize="22px" color="#2E90FA" />
        </Flex>
      ),
    },
    {
      label: 'Regularity',
      value: '78.4%',
      trend: { direction: 'down', text: '-3% vs last month' },
      icon: (
        <Flex w="44px" h="44px" borderRadius="100px" bg="#FFF4CC" align="center" justify="center">
          <Icon as={LuClock3} boxSize="22px" color="#CA8A04" />
        </Flex>
      ),
    },
  ] as const
  const villagePumpOperatorDetails = {
    name: 'Ajay Yadav',
    scheme: 'Rural Water Supply 001',
    stationLocation: 'Central Pumping Station',
    lastSubmission: '11-02-24, 1:00pm',
    reportingRate: '85%',
    missingSubmissionCount: '3',
    inactiveDays: '2',
  }

  const pumpOperatorsTotal = data.pumpOperators.reduce((total, item) => total + item.value, 0)
  const leadingPumpOperators = data.leadingPumpOperators ?? []
  const bottomPumpOperators = data.bottomPumpOperators ?? []
  const operatorsPerformanceTable = [...leadingPumpOperators, ...bottomPumpOperators]
  const villagePhotoEvidenceRows = data.photoEvidenceCompliance.map((row) => ({
    ...row,
    name: villagePumpOperatorDetails.name,
  }))

  return (
    <Box>
      <DashboardFilters
        filterTabIndex={filterTabIndex}
        onTabChange={setFilterTabIndex}
        onClear={handleClearFilters}
        isAdvancedEnabled={isAdvancedEnabled}
        isDepartmentStateSelected={isDepartmentStateSelected}
        emptyOptions={emptyOptions}
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        selectedBlock={selectedBlock}
        selectedGramPanchayat={selectedGramPanchayat}
        selectedVillage={selectedVillage}
        selectedScheme={selectedScheme}
        selectedDuration={selectedDuration}
        selectedDepartmentState={selectedDepartmentState}
        selectedDepartmentZone={selectedDepartmentZone}
        selectedDepartmentCircle={selectedDepartmentCircle}
        selectedDepartmentDivision={selectedDepartmentDivision}
        selectedDepartmentSubdivision={selectedDepartmentSubdivision}
        selectedDepartmentVillage={selectedDepartmentVillage}
        activeTrailIndex={effectiveTrailIndex}
        districtOptions={districtOptions}
        blockOptions={blockOptions}
        gramPanchayatOptions={gramPanchayatOptions}
        villageOptions={villageOptions}
        mockFilterStates={mockFilterStates}
        mockFilterSchemes={mockFilterSchemes}
        onStateChange={handleStateChange}
        onDistrictChange={handleDistrictChange}
        onBlockChange={handleBlockChange}
        onGramPanchayatChange={handleGramPanchayatChange}
        setSelectedVillage={handleVillageChange}
        setSelectedScheme={setSelectedScheme}
        setSelectedDuration={setSelectedDuration}
        onDepartmentStateChange={handleDepartmentStateChange}
        setSelectedDepartmentZone={setSelectedDepartmentZone}
        setSelectedDepartmentCircle={setSelectedDepartmentCircle}
        setSelectedDepartmentDivision={setSelectedDepartmentDivision}
        setSelectedDepartmentSubdivision={setSelectedDepartmentSubdivision}
        setSelectedDepartmentVillage={setSelectedDepartmentVillage}
        onActiveTrailChange={setActiveTrailIndex}
      />

      {/* KPI Cards */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={4} mb={6}>
        {coreMetrics.map((metric) => (
          <KPICard
            key={metric.label}
            title={metric.label}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
          />
        ))}
      </Grid>

      {/* Map and Core Metrics */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={6} mb={6}>
        <Box
          bg="white"
          borderWidth="0.5px"
          borderRadius="12px"
          borderColor="#E4E4E7"
          pt="24px"
          pb="10px"
          pl="16px"
          pr="16px"
          w="full"
          h="710px"
        >
          <IndiaMapChart
            data={data.mapData}
            onStateClick={handleStateClick}
            onStateHover={handleStateHover}
            height="100%"
          />
        </Box>
        {isVillageSelected ? (
          <Flex direction="column" gap="28px" w="full">
            <Box
              bg="white"
              borderWidth="0.5px"
              borderRadius="12px"
              borderColor="#E4E4E7"
              pt="24px"
              pb="24px"
              pl="16px"
              pr="16px"
              w="full"
              h="330px"
            >
              <Text textStyle="bodyText3" fontWeight="400" mb={4}>
                Core Metrics
              </Text>
              <Box>
                <Grid templateColumns="repeat(2, 1fr)" gap="12px">
                  {coreMetrics.map((metric) => {
                    const isPositive = metric.trend.direction === 'up'
                    const TrendIcon = isPositive ? MdArrowUpward : MdArrowDownward
                    const trendColor = isPositive ? '#079455' : '#D92D20'

                    return (
                      <Box
                        key={metric.label}
                        px="16px"
                        py="12px"
                        h="112px"
                        bg="#FAFAFA"
                        borderRadius="8px"
                      >
                        <Flex direction="column" align="center" gap="4px" h="100%" w="full">
                          <Flex align="center" justify="center" w="full" position="relative">
                            <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                              {metric.label}
                            </Text>
                            <Icon
                              as={AiOutlineInfoCircle}
                              boxSize="16px"
                              color="neutral.400"
                              position="absolute"
                              right="0"
                            />
                          </Flex>
                          <Text textStyle="bodyText2" fontWeight="400" color="neutral.950">
                            {metric.value}
                          </Text>
                          <Flex align="center" gap={1}>
                            <Icon as={TrendIcon} boxSize="16px" color={trendColor} />
                            <Text textStyle="bodyText4" fontWeight="400" color={trendColor}>
                              {metric.trend.text}
                            </Text>
                          </Flex>
                        </Flex>
                      </Box>
                    )
                  })}
                </Grid>
              </Box>
            </Box>
            <Box
              bg="white"
              borderWidth="0.5px"
              borderRadius="12px"
              borderColor="#E4E4E7"
              pt="24px"
              pb="24px"
              pl="16px"
              pr="16px"
              w="full"
              h="373px"
            >
              <Text textStyle="bodyText3" fontWeight="400" mb={4}>
                Pump Operator Details
              </Text>
              <Flex align="center" gap={3} mb={6}>
                <Avatar name={villagePumpOperatorDetails.name} boxSize="44px" />
                <Text textStyle="bodyText4" fontSize="14px" fontWeight="500" color="neutral.950">
                  {villagePumpOperatorDetails.name}
                </Text>
              </Flex>
              <Grid templateColumns="1fr auto" columnGap="24px" rowGap="12px" alignItems="center">
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  Scheme name/ Scheme ID
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.950" textAlign="right">
                  {villagePumpOperatorDetails.scheme}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  Station location
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.950" textAlign="right">
                  {villagePumpOperatorDetails.stationLocation}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  Last submission
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.950" textAlign="right">
                  {villagePumpOperatorDetails.lastSubmission}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  Reporting rate
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.950" textAlign="right">
                  {villagePumpOperatorDetails.reportingRate}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  Missing submission count
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.950" textAlign="right">
                  {villagePumpOperatorDetails.missingSubmissionCount}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  Inactive days
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.950" textAlign="right">
                  {villagePumpOperatorDetails.inactiveDays}
                </Text>
              </Grid>
            </Box>
          </Flex>
        ) : (
          <Box
            bg="white"
            borderWidth="0.5px"
            borderRadius="12px"
            borderColor="#E4E4E7"
            pt="24px"
            pb="24px"
            pl="16px"
            pr="16px"
            w="full"
            h="710px"
          >
            <Text textStyle="bodyText3" fontWeight="400" mb={4}>
              Overall Performance
            </Text>
            <AllStatesTable
              data={overallPerformanceTableData}
              entityLabel={overallPerformanceEntityLabel}
              scrollMaxHeight="620px"
            />
          </Box>
        )}
      </Grid>
      <DashboardBody
        data={data}
        isStateSelected={isStateSelected}
        isDistrictSelected={isDistrictSelected}
        isBlockSelected={isBlockSelected}
        isGramPanchayatSelected={isGramPanchayatSelected}
        selectedVillage={effectiveSelectedVillage}
        districtTableData={districtTableData}
        blockTableData={blockTableData}
        gramPanchayatTableData={gramPanchayatTableData}
        villageTableData={villageTableData}
        supplySubmissionRateData={supplySubmissionRateData}
        supplySubmissionRateLabel={supplySubmissionRateLabel}
        waterSupplyOutagesData={waterSupplyOutagesData}
        pumpOperatorsTotal={pumpOperatorsTotal}
        operatorsPerformanceTable={operatorsPerformanceTable}
        villagePhotoEvidenceRows={villagePhotoEvidenceRows}
      />
    </Box>
  )
}
