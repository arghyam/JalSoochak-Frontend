import { useMemo, useState } from 'react'
import { Box, Flex, Grid, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { DashboardData, EntityPerformance, PumpOperatorPerformanceData } from '../../types'
import {
  SupplyOutageReasonsChart,
  MetricPerformanceChart,
  MonthlyTrendChart,
  PumpOperatorsChart,
  ReadingSubmissionRateChart,
  SupplyOutageDistributionChart,
} from '../charts'
import { ReadingComplianceTable, PumpOperatorsPerformanceTable } from '../tables'
import { ReadingSubmissionStatusCard } from './reading-submission-status-card'
import { ViewBySelect } from '@/shared/components/common'

type GramPanchayatDashboardScreenProps = {
  data: DashboardData
  quantityPerformanceData: EntityPerformance[]
  villageTableData: EntityPerformance[]
  supplySubmissionRateData: EntityPerformance[]
  supplySubmissionRateLabel: string
  pumpOperatorsTotal: number
  operatorsPerformanceTable: PumpOperatorPerformanceData[]
}

type ViewBy = 'geography' | 'time'

export function GramPanchayatDashboardScreen({
  data,
  quantityPerformanceData,
  villageTableData,
  supplySubmissionRateData,
  supplySubmissionRateLabel,
  pumpOperatorsTotal,
  operatorsPerformanceTable,
}: GramPanchayatDashboardScreenProps) {
  const { t } = useTranslation('dashboard')
  const [quantityViewBy, setQuantityViewBy] = useState<ViewBy>('geography')
  const [regularityViewBy, setRegularityViewBy] = useState<ViewBy>('geography')
  const [outageDistributionViewBy, setOutageDistributionViewBy] = useState<ViewBy>('geography')
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
              ariaLabel={t('performanceCharts.quantity.ariaViewByGramPanchayat', {
                defaultValue: 'Gram panchayat quantity performance view by',
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
              entityLabel={t('performanceCharts.viewBy.villages', {
                defaultValue: 'Villages',
              })}
              yAxisLabel={t('performanceCharts.quantity.yAxisLabel', { defaultValue: 'Quantity' })}
              seriesName={t('performanceCharts.quantity.seriesName', { defaultValue: 'Quantity' })}
              showAreaLine
              areaSeriesName={t('performanceCharts.quantity.areaSeriesName', {
                defaultValue: 'Demand',
              })}
            />
          ) : (
            <MonthlyTrendChart
              data={quantityTimeTrendData}
              height="400px"
              xAxisLabel={t('performanceCharts.viewBy.month', { defaultValue: 'Month' })}
              yAxisLabel={t('performanceCharts.quantity.yAxisLabel', { defaultValue: 'Quantity' })}
              seriesName={t('performanceCharts.quantity.seriesName', { defaultValue: 'Quantity' })}
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
              {t('performanceCharts.regularity.title', {
                defaultValue: 'Regularity Performance',
              })}
            </Text>
            <ViewBySelect
              ariaLabel={t('performanceCharts.regularity.ariaViewByGramPanchayat', {
                defaultValue: 'Gram panchayat regularity performance view by',
              })}
              value={regularityViewBy}
              onChange={setRegularityViewBy}
              color="primary.500"
              borderColor="primary.500"
            />
          </Flex>
          {regularityViewBy === 'geography' ? (
            <MetricPerformanceChart
              data={villageTableData}
              metric="regularity"
              height="400px"
              entityLabel={t('performanceCharts.viewBy.villages', {
                defaultValue: 'Villages',
              })}
              yAxisLabel={t('performanceCharts.regularity.yAxisLabel', {
                defaultValue: 'Regularity',
              })}
              seriesName={t('performanceCharts.regularity.seriesName', {
                defaultValue: 'Regularity',
              })}
            />
          ) : (
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
          <SupplyOutageReasonsChart data={data.waterSupplyOutages} height="400px" />
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
              data={data.waterSupplyOutages}
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
              {t('pumpOperators.title', { defaultValue: 'Pump Operators' })}
            </Text>
            <Text textStyle="bodyText3" fontWeight="400">
              {t('pumpOperators.totalLabel', { defaultValue: 'Total' })}: {pumpOperatorsTotal}
            </Text>
          </Flex>
          <PumpOperatorsChart
            data={data.pumpOperators}
            height="360px"
            note={t('pumpOperators.note', {
              defaultValue:
                'Note: Active pump operators submit readings at least 30 days in a month.',
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
        >
          <PumpOperatorsPerformanceTable
            title={t('pumpOperators.performanceTable.title', {
              defaultValue: 'Pump Operators Performance',
            })}
            data={operatorsPerformanceTable}
            fillHeight
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
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        <Box bg="white" borderWidth="0.5px" borderRadius="12px" borderColor="#E4E4E7" px={4} py={6}>
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
