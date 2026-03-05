import { useMemo, useState } from 'react'
import { Box, Flex, Grid, Select, Text } from '@chakra-ui/react'
import type {
  DashboardData,
  EntityPerformance,
  PumpOperatorPerformanceData,
  WaterSupplyOutageData,
} from '../../types'
import {
  ImageSubmissionStatusChart,
  IssueTypeBreakdownChart,
  MetricPerformanceChart,
  MonthlyTrendChart,
  PumpOperatorsChart,
  SupplySubmissionRateChart,
  WaterSupplyOutagesChart,
} from '../charts'
import { PumpOperatorsPerformanceTable } from '../tables'

type DistrictDashboardScreenProps = {
  data: DashboardData
  blockTableData: EntityPerformance[]
  supplySubmissionRateData: EntityPerformance[]
  supplySubmissionRateLabel: string
  waterSupplyOutagesData: WaterSupplyOutageData[]
  operatorsPerformanceTable: PumpOperatorPerformanceData[]
  pumpOperatorsTotal: number
}

type ViewBy = '' | 'geography' | 'time'

export function DistrictDashboardScreen({
  data,
  blockTableData,
  supplySubmissionRateData,
  supplySubmissionRateLabel,
  waterSupplyOutagesData,
  operatorsPerformanceTable,
  pumpOperatorsTotal,
}: DistrictDashboardScreenProps) {
  const [quantityViewBy, setQuantityViewBy] = useState<ViewBy>('')
  const [regularityViewBy, setRegularityViewBy] = useState<ViewBy>('')
  const [outageDistributionViewBy, setOutageDistributionViewBy] = useState<ViewBy>('')
  const [readingSubmissionRateViewBy, setReadingSubmissionRateViewBy] = useState<ViewBy>('')

  const quantityTimeTrendData = useMemo(
    () =>
      data.demandSupply.map((item) => ({
        period: item.period,
        value: item.supply,
      })),
    [data.demandSupply]
  )

  const regularityTimeTrendData = useMemo(
    () =>
      data.demandSupply.map((item) => ({
        period: item.period,
        value: item.demand > 0 ? Math.min(100, Math.round((item.supply / item.demand) * 100)) : 0,
      })),
    [data.demandSupply]
  )

  const outageDistributionTimeTrendData = useMemo(
    () =>
      data.demandSupply.map((item) => ({
        period: item.period,
        value: Math.max(0, item.demand - item.supply),
      })),
    [data.demandSupply]
  )

  const readingSubmissionTimeTrendData = useMemo(
    () => data.readingSubmissionTrend ?? [],
    [data.readingSubmissionTrend]
  )

  return (
    <>
      {/* Quantity + Regularity */}
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
              aria-label="District quantity performance view by"
              h="32px"
              maxW="128px"
              fontSize="14px"
              fontWeight="600"
              borderRadius="4px"
              borderColor="neutral.400"
              borderWidth="1px"
              bg="white"
              color="neutral.400"
              appearance="none"
              value={quantityViewBy}
              onChange={(event) => setQuantityViewBy(event.target.value as ViewBy)}
              _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
            >
              <option value="">Select</option>
              <option value="geography">Geography</option>
              <option value="time">Time</option>
            </Select>
          </Flex>
          {quantityViewBy === '' || quantityViewBy === 'geography' ? (
            <MetricPerformanceChart
              data={blockTableData}
              metric="quantity"
              height="400px"
              entityLabel="Blocks"
              yAxisLabel="Quantity"
              seriesName="Quantity"
              showAreaLine
              areaSeriesName="Demand"
            />
          ) : (
            <MonthlyTrendChart
              data={quantityTimeTrendData}
              height="400px"
              xAxisLabel="Month"
              yAxisLabel="Quantity"
              seriesName="Quantity"
            />
          )}
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
              aria-label="District regularity performance view by"
              h="32px"
              maxW="128px"
              fontSize="14px"
              fontWeight="600"
              borderRadius="4px"
              borderColor="neutral.400"
              borderWidth="1px"
              bg="white"
              color="neutral.400"
              appearance="none"
              value={regularityViewBy}
              onChange={(event) => setRegularityViewBy(event.target.value as ViewBy)}
              _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
            >
              <option value="">Select</option>
              <option value="geography">Geography</option>
              <option value="time">Time</option>
            </Select>
          </Flex>
          {regularityViewBy === '' || regularityViewBy === 'geography' ? (
            <MetricPerformanceChart
              data={blockTableData}
              metric="regularity"
              height="400px"
              entityLabel="Blocks"
              yAxisLabel="Regularity"
              seriesName="Regularity"
            />
          ) : (
            <MonthlyTrendChart
              data={regularityTimeTrendData}
              height="400px"
              xAxisLabel="Month"
              yAxisLabel="Regularity (%)"
              seriesName="Regularity"
            />
          )}
        </Box>
      </Grid>

      {/* Supply Outage Reasons + Distribution */}
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
          h="510px"
          minW={0}
        >
          <Text textStyle="bodyText3" fontWeight="400" mb={2}>
            Supply Outage Reasons
          </Text>
          <IssueTypeBreakdownChart data={waterSupplyOutagesData} height="400px" />
        </Box>
        <Box
          bg="white"
          borderWidth="0.5px"
          borderRadius="12px"
          borderColor="#E4E4E7"
          px="16px"
          pt="24px"
          pb="24px"
          h="510px"
          minW={0}
        >
          <Flex align="center" justify="space-between">
            <Text textStyle="bodyText3" fontWeight="400">
              Supply Outage Distribution
            </Text>
            <Select
              aria-label="District supply outage distribution view by"
              h="32px"
              maxW="128px"
              fontSize="14px"
              fontWeight="600"
              borderRadius="4px"
              borderColor="neutral.400"
              borderWidth="1px"
              bg="white"
              color="neutral.400"
              appearance="none"
              value={outageDistributionViewBy}
              onChange={(event) => setOutageDistributionViewBy(event.target.value as ViewBy)}
              _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
            >
              <option value="">Select</option>
              <option value="geography">Geography</option>
              <option value="time">Time</option>
            </Select>
          </Flex>
          {outageDistributionViewBy === '' || outageDistributionViewBy === 'geography' ? (
            <WaterSupplyOutagesChart
              data={waterSupplyOutagesData}
              height="400px"
              xAxisLabel="Blocks"
            />
          ) : (
            <MonthlyTrendChart
              data={outageDistributionTimeTrendData}
              height="400px"
              xAxisLabel="Month"
              yAxisLabel="No. of days"
              seriesName="Supply outage"
            />
          )}
        </Box>
      </Grid>

      {/* Reading Submission Status + Reading Submission Rate */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={6} mb={6}>
        <Box
          bg="white"
          borderWidth="0.5px"
          borderRadius="12px"
          borderColor="#E4E4E7"
          px="16px"
          pt="24px"
          pb="24px"
          h="510px"
          minW={0}
        >
          <Text textStyle="bodyText3" fontWeight="400" mb="16px">
            Reading Submission Status
          </Text>
          <ImageSubmissionStatusChart data={data.imageSubmissionStatus} height="383px" />
        </Box>
        <Box
          bg="white"
          borderWidth="0.5px"
          borderRadius="12px"
          borderColor="#E4E4E7"
          px="16px"
          pt="24px"
          pb="24px"
          h="510px"
          minW={0}
        >
          <Flex align="center" justify="space-between">
            <Text textStyle="bodyText3" fontWeight="400">
              Reading Submission Rate
            </Text>
            <Select
              aria-label="District reading submission rate view by"
              h="32px"
              maxW="128px"
              fontSize="14px"
              fontWeight="600"
              borderRadius="4px"
              borderColor="neutral.400"
              borderWidth="1px"
              bg="white"
              color="neutral.400"
              appearance="none"
              value={readingSubmissionRateViewBy}
              onChange={(event) => setReadingSubmissionRateViewBy(event.target.value as ViewBy)}
              _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
            >
              <option value="">Select</option>
              <option value="geography">Geography</option>
              <option value="time">Time</option>
            </Select>
          </Flex>
          {readingSubmissionRateViewBy === '' || readingSubmissionRateViewBy === 'geography' ? (
            <SupplySubmissionRateChart
              data={supplySubmissionRateData}
              height="383px"
              entityLabel={supplySubmissionRateLabel}
            />
          ) : (
            <MonthlyTrendChart
              data={readingSubmissionTimeTrendData}
              height="383px"
              xAxisLabel="Month"
              yAxisLabel="Percentage"
              seriesName="Reading submission"
            />
          )}
        </Box>
      </Grid>

      {/* Pump Operators + Operators Performance */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        <Box
          bg="white"
          borderWidth="0.5px"
          borderRadius="12px"
          borderColor="#E4E4E7"
          px="16px"
          py="24px"
          h="510px"
          minW={0}
        >
          <Flex align="center" justify="space-between" mb="40px">
            <Text textStyle="bodyText3" fontWeight="400">
              Pump Operators
            </Text>
            <Text textStyle="bodyText3" fontWeight="400">
              Total: {pumpOperatorsTotal}
            </Text>
          </Flex>
          <PumpOperatorsChart
            data={data.pumpOperators}
            height="360px"
            note="Note: Active pump operators submit readings at least 30 days in a month."
          />
        </Box>
        <Box
          bg="white"
          borderWidth="0.5px"
          borderRadius="12px"
          borderColor="#E4E4E7"
          px="16px"
          py="24px"
          h="510px"
          minW={0}
        >
          <PumpOperatorsPerformanceTable
            title="Pump Operators Performance"
            data={operatorsPerformanceTable}
            fillHeight
          />
        </Box>
      </Grid>
    </>
  )
}
