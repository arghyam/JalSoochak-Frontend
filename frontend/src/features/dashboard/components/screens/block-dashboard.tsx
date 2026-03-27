import { useMemo, useState } from 'react'
import { Box, Flex, Grid, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type {
  DashboardData,
  EntityPerformance,
  PumpOperatorPerformanceData,
  WaterSupplyOutageData,
} from '../../types'
import {
  SupplyOutageReasonsChart,
  MetricPerformanceChart,
  MonthlyTrendChart,
  ActiveSchemesChart,
  ReadingSubmissionRateChart,
  SupplyOutageDistributionChart,
} from '../charts'
import { ReadingComplianceTable, SchemePerformanceTable } from '../tables'
import { ReadingSubmissionStatusCard } from './reading-submission-status-card'
import { ChartEmptyState, LoadingSpinner, ViewBySelect } from '@/shared/components/common'
import type { MonthlyTrendPoint } from '../charts/monthly-trend-chart'

type BlockDashboardScreenProps = {
  data: DashboardData
  waterSupplyOutagesData?: WaterSupplyOutageData[]
  waterSupplyOutageDistributionData?: WaterSupplyOutageData[]
  quantityPerformanceData: EntityPerformance[]
  quantityTimeTrendData: MonthlyTrendPoint[]
  isQuantityTimeTrendLoading?: boolean
  isQuantityTimeTrendAwaitingParams?: boolean
  regularityPerformanceData: EntityPerformance[]
  regularityTimeTrendData: MonthlyTrendPoint[]
  isRegularityTimeTrendLoading?: boolean
  gramPanchayatTableData: EntityPerformance[]
  supplySubmissionRateData: EntityPerformance[]
  supplySubmissionRateLabel: string
  pumpOperatorsTotal: number
  operatorsPerformanceTable: PumpOperatorPerformanceData[]
}

type ViewBy = 'geography' | 'time'

export function BlockDashboardScreen({
  data,
  waterSupplyOutagesData = data.waterSupplyOutages,
  waterSupplyOutageDistributionData = data.waterSupplyOutages,
  quantityPerformanceData,
  quantityTimeTrendData,
  isQuantityTimeTrendLoading = false,
  isQuantityTimeTrendAwaitingParams = false,
  regularityPerformanceData,
  regularityTimeTrendData,
  isRegularityTimeTrendLoading = false,
  supplySubmissionRateData,
  supplySubmissionRateLabel,
  pumpOperatorsTotal,
  operatorsPerformanceTable,
}: BlockDashboardScreenProps) {
  const { t } = useTranslation('dashboard')
  const [quantityViewBy, setQuantityViewBy] = useState<ViewBy>('geography')
  const [regularityViewBy, setRegularityViewBy] = useState<ViewBy>('geography')
  const [outageDistributionViewBy, setOutageDistributionViewBy] = useState<ViewBy>('geography')
  const outageDistributionTimeTrendData = useMemo(
    () => data.supplyOutageTrend ?? [],
    [data.supplyOutageTrend]
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
              {t('performanceCharts.quantity.title', { defaultValue: 'Quantity Performance' })}
            </Text>
            <ViewBySelect
              ariaLabel={t('performanceCharts.quantity.ariaViewByBlock', {
                defaultValue: 'Block quantity performance view by',
              })}
              value={quantityViewBy}
              onChange={setQuantityViewBy}
              color="primary.500"
              borderColor="primary.500"
            />
          </Flex>
          {quantityViewBy === 'geography' ? (
            <MetricPerformanceChart
              data={quantityPerformanceData}
              metric="quantity"
              height="400px"
              entityLabel={t('performanceCharts.viewBy.gramPanchayats', {
                defaultValue: 'Gram Panchayats',
              })}
              yAxisLabel={t('performanceCharts.quantity.yAxisLabel', { defaultValue: 'Quantity' })}
              seriesName={t('performanceCharts.quantity.seriesName', { defaultValue: 'Quantity' })}
              showAreaLine
              areaSeriesName={t('performanceCharts.quantity.areaSeriesName', {
                defaultValue: 'Demand',
              })}
            />
          ) : (
            <>
              {isQuantityTimeTrendLoading ? (
                <Flex align="center" justify="center" h="400px">
                  <LoadingSpinner />
                </Flex>
              ) : quantityTimeTrendData.length > 0 ? (
                <MonthlyTrendChart
                  data={quantityTimeTrendData}
                  height="400px"
                  xAxisLabel={t('performanceCharts.viewBy.month', { defaultValue: 'Month' })}
                  yAxisLabel={t('performanceCharts.quantity.yAxisLabel', {
                    defaultValue: 'Quantity',
                  })}
                  seriesName={t('performanceCharts.quantity.seriesName', {
                    defaultValue: 'Quantity',
                  })}
                />
              ) : isQuantityTimeTrendAwaitingParams ? null : (
                <ChartEmptyState minHeight="400px" />
              )}
            </>
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
              {t('performanceCharts.regularity.title', {
                defaultValue: 'Regularity Performance',
              })}
            </Text>
            <ViewBySelect
              ariaLabel={t('performanceCharts.regularity.ariaViewByBlock', {
                defaultValue: 'Block regularity performance view by',
              })}
              value={regularityViewBy}
              onChange={setRegularityViewBy}
              color="primary.500"
              borderColor="primary.500"
            />
          </Flex>
          {regularityViewBy === 'geography' ? (
            <MetricPerformanceChart
              data={regularityPerformanceData}
              metric="regularity"
              height="400px"
              entityLabel={t('performanceCharts.viewBy.gramPanchayats', {
                defaultValue: 'Gram Panchayats',
              })}
              yAxisLabel={t('performanceCharts.regularity.yAxisLabel', {
                defaultValue: 'Regularity',
              })}
              seriesName={t('performanceCharts.regularity.seriesName', {
                defaultValue: 'Regularity',
              })}
            />
          ) : (
            <>
              {isRegularityTimeTrendLoading ? (
                <Flex align="center" justify="center" h="400px">
                  <LoadingSpinner />
                </Flex>
              ) : regularityTimeTrendData.length > 0 ? (
                <MonthlyTrendChart
                  data={regularityTimeTrendData}
                  height="400px"
                  isPercent
                  xAxisLabel={t('performanceCharts.viewBy.month', { defaultValue: 'Month' })}
                  yAxisLabel={t('performanceCharts.regularity.yAxisLabelPercent', {
                    defaultValue: 'Regularity (%)',
                  })}
                  seriesName={t('performanceCharts.regularity.seriesName', {
                    defaultValue: 'Regularity',
                  })}
                />
              ) : (
                <ChartEmptyState minHeight="400px" />
              )}
            </>
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
          <Text textStyle="bodyText3" fontWeight="400" mb="40px">
            {t('outageAndSubmissionCharts.titles.supplyOutageReasons', {
              defaultValue: 'Supply Outage Reasons',
            })}
          </Text>
          <SupplyOutageReasonsChart data={waterSupplyOutagesData} height="400px" />
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
              {t('outageAndSubmissionCharts.titles.supplyOutageDistribution', {
                defaultValue: 'Supply Outage Distribution',
              })}
            </Text>
            <ViewBySelect
              ariaLabel={t('outageAndSubmissionCharts.ariaViewByBlock', {
                defaultValue: 'Block supply outage distribution view by',
              })}
              value={outageDistributionViewBy}
              onChange={setOutageDistributionViewBy}
              color="primary.500"
              borderColor="primary.500"
            />
          </Flex>
          {outageDistributionViewBy === 'geography' ? (
            <SupplyOutageDistributionChart
              data={waterSupplyOutageDistributionData}
              height="400px"
              xAxisLabel={t('performanceCharts.viewBy.gramPanchayats', {
                defaultValue: 'Gram Panchayats',
              })}
            />
          ) : (
            <MonthlyTrendChart
              data={outageDistributionTimeTrendData}
              height="400px"
              xAxisLabel={t('performanceCharts.viewBy.month', { defaultValue: 'Month' })}
              yAxisLabel={t('outageAndSubmissionCharts.axis.noOfDays', {
                defaultValue: 'No. of days',
              })}
              seriesName={t('outageAndSubmissionCharts.series.supplyOutage', {
                defaultValue: 'Supply outage',
              })}
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
              {t('pumpOperators.title', { defaultValue: 'Active Schemes' })}
            </Text>
            <Text textStyle="bodyText3" fontWeight="400">
              {t('pumpOperators.totalLabel', { defaultValue: 'Total' })}: {pumpOperatorsTotal}
            </Text>
          </Flex>
          <ActiveSchemesChart
            data={data.pumpOperators}
            height="360px"
            note={t('pumpOperators.note', {
              defaultValue: 'Note: Active schemes for at least 30 days in a month',
            })}
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
          display="flex"
          flexDirection="column"
          minH={0}
        >
          <SchemePerformanceTable
            title={t('pumpOperators.performanceTable.title', {
              defaultValue: 'Scheme Performance',
            })}
            data={operatorsPerformanceTable}
            fillHeight
            secondaryColumnLabel={t('performanceCharts.viewBy.gramPanchayats', {
              defaultValue: 'Gram Panchayats',
            })}
            showBlockColumn={false}
          />
        </Box>
      </Grid>

      {/* Reading Submission Status + Reading Submission Rate */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={6} mb={6}>
        <ReadingSubmissionStatusCard data={data.readingSubmissionStatus} chartHeight="336px" />
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
          <Text textStyle="bodyText3" fontWeight="400" mb={2}>
            {t('outageAndSubmissionCharts.titles.readingSubmissionRate', {
              defaultValue: 'Reading Submission Rate',
            })}
          </Text>
          <ReadingSubmissionRateChart
            data={supplySubmissionRateData}
            height="383px"
            entityLabel={supplySubmissionRateLabel}
          />
        </Box>
      </Grid>

      {/* Reading Compliance */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={6} mb={6}>
        <Box
          bg="white"
          borderWidth="0.5px"
          borderRadius="12px"
          borderColor="#E4E4E7"
          px={4}
          py={6}
          minW={0}
        >
          <ReadingComplianceTable
            data={data.readingCompliance}
            title={t('outageAndSubmissionCharts.titles.readingCompliance', {
              defaultValue: 'Reading Compliance',
            })}
          />
        </Box>
        <Box
          display={{ base: 'none', lg: 'block' }}
          borderRadius="12px"
          borderWidth="0.5px"
          borderColor="transparent"
          bg="transparent"
        />
      </Grid>
    </>
  )
}
