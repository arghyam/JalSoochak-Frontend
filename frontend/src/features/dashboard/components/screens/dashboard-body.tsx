import { Box, Flex, Grid, Select, Text } from '@chakra-ui/react'
import type {
  DashboardData,
  EntityPerformance,
  PumpOperatorPerformanceData,
  WaterSupplyOutageData,
} from '../../types'
import {
  IssueTypeBreakdownChart,
  MetricPerformanceChart,
  SupplySubmissionRateChart,
} from '../charts'
import { BlockDashboardScreen } from './block-dashboard'
import { DistrictDashboardScreen } from './district-dashboard'
import { GramPanchayatDashboardScreen } from './gram-panchayat-dashboard'
import { StateUtDashboardScreen } from './state-ut-dashboard'
import { VillageDashboardScreen } from './village-dashboard'

type DashboardBodyProps = {
  data: DashboardData
  isStateSelected: boolean
  isDistrictSelected: boolean
  isBlockSelected: boolean
  isGramPanchayatSelected: boolean
  selectedVillage: string
  performanceState: string
  onPerformanceStateChange: (value: string) => void
  districtTableData: EntityPerformance[]
  blockTableData: EntityPerformance[]
  gramPanchayatTableData: EntityPerformance[]
  villageTableData: EntityPerformance[]
  supplySubmissionRateData: EntityPerformance[]
  supplySubmissionRateLabel: string
  waterSupplyOutagesData: WaterSupplyOutageData[]
  pumpOperatorsTotal: number
  operatorsPerformanceTable: PumpOperatorPerformanceData[]
  villagePhotoEvidenceRows: DashboardData['photoEvidenceCompliance']
}

export function DashboardBody({
  data,
  isStateSelected,
  isDistrictSelected,
  isBlockSelected,
  isGramPanchayatSelected,
  selectedVillage,
  performanceState,
  onPerformanceStateChange,
  districtTableData,
  blockTableData,
  gramPanchayatTableData,
  villageTableData,
  supplySubmissionRateData,
  supplySubmissionRateLabel,
  waterSupplyOutagesData,
  pumpOperatorsTotal,
  operatorsPerformanceTable,
  villagePhotoEvidenceRows,
}: DashboardBodyProps) {
  const isStateScreen =
    isStateSelected &&
    !isDistrictSelected &&
    !isBlockSelected &&
    !isGramPanchayatSelected &&
    !selectedVillage
  const isDistrictScreen =
    isDistrictSelected && !isBlockSelected && !isGramPanchayatSelected && !selectedVillage
  const isBlockScreen = isBlockSelected && !isGramPanchayatSelected && !selectedVillage
  const isGramPanchayatScreen = isGramPanchayatSelected && !selectedVillage
  const performanceStateOptions = Array.from(
    new Set(
      data.mapData
        .map((item) => item.name)
        .filter((name): name is string => Boolean(name && name.trim()))
    )
  )
  const performanceChartData = performanceState
    ? data.mapData.filter((item) => item.name === performanceState)
    : data.mapData

  return (
    <>
      {isStateScreen ? (
        <StateUtDashboardScreen
          data={data}
          districtTableData={districtTableData}
          supplySubmissionRateData={supplySubmissionRateData}
          supplySubmissionRateLabel={supplySubmissionRateLabel}
          waterSupplyOutagesData={waterSupplyOutagesData}
        />
      ) : null}
      {isDistrictScreen ? (
        <DistrictDashboardScreen
          data={data}
          blockTableData={blockTableData}
          supplySubmissionRateData={supplySubmissionRateData}
          supplySubmissionRateLabel={supplySubmissionRateLabel}
          operatorsPerformanceTable={operatorsPerformanceTable}
          pumpOperatorsTotal={pumpOperatorsTotal}
        />
      ) : null}
      {isBlockScreen ? (
        <BlockDashboardScreen
          data={data}
          gramPanchayatTableData={gramPanchayatTableData}
          supplySubmissionRateData={supplySubmissionRateData}
          supplySubmissionRateLabel={supplySubmissionRateLabel}
          pumpOperatorsTotal={pumpOperatorsTotal}
          operatorsPerformanceTable={operatorsPerformanceTable}
        />
      ) : null}
      {isGramPanchayatScreen ? (
        <GramPanchayatDashboardScreen
          data={data}
          villageTableData={villageTableData}
          supplySubmissionRateData={supplySubmissionRateData}
          supplySubmissionRateLabel={supplySubmissionRateLabel}
          pumpOperatorsTotal={pumpOperatorsTotal}
          operatorsPerformanceTable={operatorsPerformanceTable}
        />
      ) : null}

      {selectedVillage ? (
        <VillageDashboardScreen
          data={data}
          villagePhotoEvidenceRows={villagePhotoEvidenceRows}
          waterSupplyOutagesData={waterSupplyOutagesData}
        />
      ) : null}

      {/* Quantity + Regularity Charts */}
      {!selectedVillage &&
      !isStateScreen &&
      !isDistrictScreen &&
      !isBlockScreen &&
      !isGramPanchayatScreen ? (
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={6} mb={6}>
          <Box
            bg="white"
            borderWidth="0.5px"
            borderRadius="12px"
            borderColor="#E4E4E7"
            px="16px"
            pt="24px"
            pb="24px"
            h="523px"
            w="full"
            minW={0}
          >
            <Flex align="center" justify="space-between">
              <Text textStyle="bodyText3" fontWeight="400">
                Quantity Performance
              </Text>
              <Select
                aria-label="Quantity performance state"
                h="32px"
                maxW="96px"
                fontSize="14px"
                fontWeight="600"
                borderRadius="4px"
                borderColor="neutral.400"
                borderWidth="1px"
                bg="white"
                color="neutral.400"
                placeholder="Select"
                appearance="none"
                value={performanceState}
                onChange={(event) => onPerformanceStateChange(event.target.value)}
                _focus={{
                  borderColor: 'primary.500',
                  boxShadow: 'none',
                }}
              >
                {performanceStateOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Flex>
            <MetricPerformanceChart
              data={performanceChartData}
              metric="quantity"
              height="400px"
              entityLabel="States/UTs"
              yAxisLabel="Quantity"
              seriesName="Quantity"
              showAreaLine
              areaSeriesName="Demand"
            />
          </Box>
          <Box
            bg="white"
            borderWidth="0.5px"
            borderRadius="12px"
            borderColor="#E4E4E7"
            px="16px"
            pt="24px"
            pb="24px"
            h="523px"
            minW={0}
          >
            <Flex align="center" justify="space-between">
              <Text textStyle="bodyText3" fontWeight="400">
                Regularity Performance
              </Text>
              <Select
                aria-label="Regularity performance state"
                h="32px"
                maxW="96px"
                fontSize="14px"
                fontWeight="600"
                borderRadius="4px"
                borderColor="neutral.400"
                borderWidth="1px"
                bg="white"
                color="neutral.400"
                placeholder="Select"
                appearance="none"
                value={performanceState}
                onChange={(event) => onPerformanceStateChange(event.target.value)}
                _focus={{
                  borderColor: 'primary.500',
                  boxShadow: 'none',
                }}
              >
                {performanceStateOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Flex>
            <MetricPerformanceChart
              data={performanceChartData}
              metric="regularity"
              height="400px"
              entityLabel="States/UTs"
              yAxisLabel="Regularity"
              seriesName="Regularity"
            />
          </Box>
        </Grid>
      ) : null}

      {/* Supply outage reasons + Submission Rate */}
      {!selectedVillage &&
      !isStateScreen &&
      !isDistrictScreen &&
      !isBlockSelected &&
      !isGramPanchayatScreen ? (
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={6} mb={6}>
          <Box
            bg="white"
            borderWidth="0.5px"
            borderRadius="12px"
            borderColor="#E4E4E7"
            pt="24px"
            pb="24px"
            pl="16px"
            pr="16px"
            h="523px"
            w="full"
            minW={0}
          >
            <Text textStyle="bodyText3" fontWeight="400" mb={2}>
              Supply Outage Reasons
            </Text>
            <IssueTypeBreakdownChart data={waterSupplyOutagesData} height="400px" />
          </Box>
          <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="510px" minW={0}>
            <Text textStyle="bodyText3" fontWeight="400" mb={2}>
              Reading Submission Rate
            </Text>
            <SupplySubmissionRateChart
              data={supplySubmissionRateData}
              height="383px"
              entityLabel={supplySubmissionRateLabel}
            />
          </Box>
        </Grid>
      ) : null}
    </>
  )
}
