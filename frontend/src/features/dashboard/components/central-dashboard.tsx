import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Flex, Text, Heading, Grid, Icon, Image, Avatar } from '@chakra-ui/react'
import { useDashboardData } from '../hooks/use-dashboard-data'
import { KPICard } from './kpi-card'
import { DashboardBody } from './screens/dashboard-body'
import { IndiaMapChart } from './charts'
import { LoadingSpinner } from '@/shared/components/common'
import { MdOutlineWaterDrop, MdArrowUpward, MdArrowDownward } from 'react-icons/md'
import { AiOutlineHome, AiOutlineInfoCircle } from 'react-icons/ai'
import waterTapIcon from '@/assets/media/water-tap_1822589 1.svg'
import type { DateRange, SearchableSelectOption } from '@/shared/components/common'
import type { EntityPerformance } from '../types'
import { DashboardFilters } from './filters/dashboard-filters'
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
  selectedState?: string
  selectedDistrict?: string
  selectedBlock?: string
  selectedGramPanchayat?: string
  selectedVillage?: string
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

export function CentralDashboard() {
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
  const [selectedState, setSelectedState] = useState(storedFilters.selectedState ?? '')
  const [selectedDistrict, setSelectedDistrict] = useState(storedFilters.selectedDistrict ?? '')
  const [selectedBlock, setSelectedBlock] = useState(storedFilters.selectedBlock ?? '')
  const [selectedGramPanchayat, setSelectedGramPanchayat] = useState(
    storedFilters.selectedGramPanchayat ?? ''
  )
  const [selectedVillage, setSelectedVillage] = useState(storedFilters.selectedVillage ?? '')
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
  const [performanceState, setPerformanceState] = useState('')
  const [filterTabIndex, setFilterTabIndex] = useState(
    typeof storedFilters.filterTabIndex === 'number' ? storedFilters.filterTabIndex : 0
  )
  const isStateSelected = Boolean(selectedState)
  const isDistrictSelected = Boolean(selectedDistrict)
  const isBlockSelected = Boolean(selectedBlock)
  const isGramPanchayatSelected = Boolean(selectedGramPanchayat)
  const isDepartmentStateSelected = Boolean(selectedDepartmentState)
  const emptyOptions: SearchableSelectOption[] = []
  const isAdvancedEnabled = Boolean(selectedState && selectedDistrict)
  const districtTableData =
    mockDistrictPerformanceByState[selectedState] ?? ([] as EntityPerformance[])
  const blockTableData =
    mockBlockPerformanceByDistrict[selectedDistrict] ?? ([] as EntityPerformance[])
  const gramPanchayatTableData =
    mockGramPanchayatPerformanceByBlock[selectedBlock] ?? ([] as EntityPerformance[])
  const villageTableData =
    mockVillagePerformanceByGramPanchayat[selectedGramPanchayat] ?? ([] as EntityPerformance[])
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
  const districtOptions = selectedState ? (mockFilterDistricts[selectedState] ?? []) : emptyOptions
  const blockOptions = selectedDistrict ? (mockFilterBlocks[selectedDistrict] ?? []) : emptyOptions
  const gramPanchayatOptions = selectedBlock
    ? (mockFilterGramPanchayats[selectedBlock] ?? [])
    : emptyOptions
  const villageOptions = selectedGramPanchayat
    ? (mockFilterVillages[selectedGramPanchayat] ?? [])
    : emptyOptions
  const handleStateChange = (value: string) => {
    setSelectedState(value)
    setSelectedDistrict('')
    setSelectedBlock('')
    setSelectedGramPanchayat('')
    setSelectedVillage('')
  }
  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value)
    setSelectedBlock('')
    setSelectedGramPanchayat('')
    setSelectedVillage('')
  }
  const handleBlockChange = (value: string) => {
    setSelectedBlock(value)
    setSelectedGramPanchayat('')
    setSelectedVillage('')
  }
  const handleGramPanchayatChange = (value: string) => {
    setSelectedGramPanchayat(value)
    setSelectedVillage('')
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
    setSelectedState('')
    setSelectedDistrict('')
    setSelectedBlock('')
    setSelectedGramPanchayat('')
    setSelectedVillage('')
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

  const handleStateClick = (stateId: string, _stateName: string) => {
    navigate(`/states/${stateId}`)
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
    ? (mockVillagePerformanceByGramPanchayat[selectedGramPanchayat] ?? []).map((village, index) => {
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
      ? (mockGramPanchayatPerformanceByBlock[selectedBlock] ?? []).map((gramPanchayat, index) => {
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
        ? (mockBlockPerformanceByDistrict[selectedDistrict] ?? []).map((block, index) => {
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
        : data.waterSupplyOutages

  const coreMetrics = [
    {
      label: 'Coverage',
      value: '78.4%',
      trend: { direction: 'up', text: '+0.5% vs last month' },
    },
    {
      label: 'Continuity',
      value: '94',
      trend: { direction: 'down', text: '-1 vs last month' },
    },
    {
      label: 'Quantity',
      value: '78.4%',
      trend: { direction: 'up', text: '+2 LPCD vs last month' },
    },
    {
      label: 'Regularity',
      value: '78.4%',
      trend: { direction: 'down', text: '-3% vs last month' },
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
        setSelectedVillage={setSelectedVillage}
        setSelectedScheme={setSelectedScheme}
        setSelectedDuration={setSelectedDuration}
        onDepartmentStateChange={handleDepartmentStateChange}
        setSelectedDepartmentZone={setSelectedDepartmentZone}
        setSelectedDepartmentCircle={setSelectedDepartmentCircle}
        setSelectedDepartmentDivision={setSelectedDepartmentDivision}
        setSelectedDepartmentSubdivision={setSelectedDepartmentSubdivision}
        setSelectedDepartmentVillage={setSelectedDepartmentVillage}
      />

      {/* KPI Cards */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={4} mb={6}>
        <KPICard
          title="Number of schemes"
          value={data.kpis.totalSchemes}
          icon={
            <Flex
              w="48px"
              h="48px"
              borderRadius="100px"
              bg="primary.25"
              align="center"
              justify="center"
            >
              <Icon as={MdOutlineWaterDrop} boxSize="28px" color="primary.500" />
            </Flex>
          }
        />
        <KPICard
          title="Total Number of Rural Households"
          value={data.kpis.totalRuralHouseholds}
          icon={
            <Flex
              w="48px"
              h="48px"
              borderRadius="100px"
              bg="#FFFBD7"
              align="center"
              justify="center"
            >
              <Icon as={AiOutlineHome} boxSize="28px" color="#CA8A04" />
            </Flex>
          }
        />
        <KPICard
          title="Functional Household Tap Connection"
          value={data.kpis.functionalTapConnections}
          icon={
            <Flex
              w="48px"
              h="48px"
              borderRadius="100px"
              bg="#E1FFEA"
              align="center"
              justify="center"
            >
              <Image src={waterTapIcon} alt="" boxSize="24px" />
            </Flex>
          }
        />
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
          h="731px"
        >
          <IndiaMapChart
            data={data.mapData}
            onStateClick={handleStateClick}
            onStateHover={handleStateHover}
            height="100%"
          />
        </Box>
        {selectedVillage ? (
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
            h="731px"
          >
            <Text textStyle="bodyText3" fontWeight="400" mb={4}>
              Core Metrics
            </Text>
            <Flex direction="column" gap="16px">
              {coreMetrics.map((metric) => {
                const isPositive = metric.trend.direction === 'up'
                const TrendIcon = isPositive ? MdArrowUpward : MdArrowDownward
                const trendColor = isPositive ? '#079455' : '#D92D20'

                return (
                  <Box key={metric.label} bg="#FAFAFA" borderRadius="8px" px="16px" py="24px">
                    <Flex direction="column" align="center" gap="4px" h="92px" w="full">
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
                      <Text textStyle="bodyText2" fontWeight="400" color="neutral.900">
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
            </Flex>
          </Box>
        )}
      </Grid>
      <DashboardBody
        data={data}
        isStateSelected={isStateSelected}
        isDistrictSelected={isDistrictSelected}
        isBlockSelected={isBlockSelected}
        isGramPanchayatSelected={isGramPanchayatSelected}
        selectedVillage={selectedVillage}
        performanceState={performanceState}
        onPerformanceStateChange={setPerformanceState}
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
