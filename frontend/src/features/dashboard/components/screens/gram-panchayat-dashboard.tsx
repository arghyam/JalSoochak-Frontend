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
  MonthlyTrendChart,
  ActiveSchemesChart,
  ReadingSubmissionRateChart,
  SupplyOutageDistributionChart,
} from '../charts'
import { ReadingComplianceTable, SchemePerformanceTable } from '../tables'
import { PerformanceChartCard } from './performance-chart-card'
import { ReadingSubmissionStatusCard } from './reading-submission-status-card'
import { ViewBySelect } from '@/shared/components/common'
import type { MonthlyTrendPoint } from '../charts/monthly-trend-chart'

type GramPanchayatDashboardScreenProps = {
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
  villageTableData: EntityPerformance[]
  supplySubmissionRateData: EntityPerformance[]
  supplySubmissionRateLabel: string
  pumpOperatorsTotal: number
  operatorsPerformanceTable: PumpOperatorPerformanceData[]
}

type ViewBy = 'geography' | 'time'

export function GramPanchayatDashboardScreen({
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
}: GramPanchayatDashboardScreenProps) {
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
        <PerformanceChartCard
          title={t('performanceCharts.quantity.title', { defaultValue: 'Quantity Performance' })}
          viewByAriaLabel={t('performanceCharts.quantity.ariaViewByGramPanchayat', {
            defaultValue: 'Gram panchayat quantity performance view by',
          })}
          viewBy={quantityViewBy}
          onViewByChange={setQuantityViewBy}
          data={quantityPerformanceData}
          metric="quantity"
          timeTrendData={quantityTimeTrendData}
          isTimeTrendLoading={isQuantityTimeTrendLoading}
          isTimeTrendAwaitingParams={isQuantityTimeTrendAwaitingParams}
          entityLabel={t('performanceCharts.viewBy.villages', {
            defaultValue: 'Villages',
          })}
          yAxisLabel={t('performanceCharts.quantity.yAxisLabel', { defaultValue: 'Quantity' })}
          seriesName={t('performanceCharts.quantity.seriesName', { defaultValue: 'Quantity' })}
          cardHeight="523px"
          showAreaLine
          areaSeriesName={t('performanceCharts.quantity.areaSeriesName', {
            defaultValue: 'Demand',
          })}
          timeXAxisLabel={t('performanceCharts.viewBy.month', { defaultValue: 'Month' })}
          selectColor="primary.500"
          selectBorderColor="primary.500"
        />
        <PerformanceChartCard
          title={t('performanceCharts.regularity.title', {
            defaultValue: 'Regularity Performance',
          })}
          viewByAriaLabel={t('performanceCharts.regularity.ariaViewByGramPanchayat', {
            defaultValue: 'Gram panchayat regularity performance view by',
          })}
          viewBy={regularityViewBy}
          onViewByChange={setRegularityViewBy}
          data={regularityPerformanceData}
          metric="regularity"
          timeTrendData={regularityTimeTrendData}
          isTimeTrendLoading={isRegularityTimeTrendLoading}
          entityLabel={t('performanceCharts.viewBy.villages', {
            defaultValue: 'Villages',
          })}
          yAxisLabel={t('performanceCharts.regularity.yAxisLabel', {
            defaultValue: 'Regularity',
          })}
          seriesName={t('performanceCharts.regularity.seriesName', {
            defaultValue: 'Regularity',
          })}
          cardHeight="523px"
          timeXAxisLabel={t('performanceCharts.viewBy.month', { defaultValue: 'Month' })}
          timeYAxisLabel={t('performanceCharts.regularity.yAxisLabelPercent', {
            defaultValue: 'Regularity (%)',
          })}
          isTimeTrendPercent
          selectColor="primary.500"
          selectBorderColor="primary.500"
        />
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
              ariaLabel={t('outageAndSubmissionCharts.ariaViewByGramPanchayat', {
                defaultValue: 'Gram panchayat supply outage distribution view by',
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
              xAxisLabel={t('performanceCharts.viewBy.villages', {
                defaultValue: 'Villages',
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
          display="flex"
          flexDirection="column"
        >
          <Text textStyle="bodyText3" fontWeight="400" mb={2}>
            {t('outageAndSubmissionCharts.titles.readingSubmissionRate', {
              defaultValue: 'Reading Submission Rate',
            })}
          </Text>
          <Box flex="1" minH={0}>
            <ReadingSubmissionRateChart
              data={supplySubmissionRateData}
              height="100%"
              entityLabel={supplySubmissionRateLabel}
            />
          </Box>
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
