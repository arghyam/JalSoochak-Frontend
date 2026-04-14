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
import { SchemePerformanceTable } from '../tables'
import { PerformanceChartCard } from './performance-chart-card'
import { ReadingSubmissionStatusCard } from './reading-submission-status-card'
import { ChartEmptyState, ViewBySelect } from '@/shared/components/common'
import type { MonthlyTrendPoint } from '../charts/monthly-trend-chart'
import { useOutageDistributionState } from './use-outage-distribution-state'
import { getOutageTimeScaleXAxisLabel, OutageTimeScaleToggle } from './outage-time-scale-toggle'

type DistrictDashboardScreenProps = {
  data: DashboardData
  waterSupplyOutagesData?: WaterSupplyOutageData[]
  waterSupplyOutageDistributionData?: WaterSupplyOutageData[]
  quantityPerformanceData: EntityPerformance[]
  quantityTimeTrendData: MonthlyTrendPoint[]
  isQuantityTimeTrendLoading?: boolean
  isQuantityTimeTrendAwaitingParams?: boolean
  quantityTimeScaleTab?: 'day' | 'week' | 'month'
  onQuantityTimeScaleTabChange?: (value: 'day' | 'week' | 'month') => void
  regularityTimeScaleTab?: 'day' | 'week' | 'month'
  onRegularityTimeScaleTabChange?: (value: 'day' | 'week' | 'month') => void
  outageDistributionTimeScaleTab?: 'day' | 'week' | 'month'
  onOutageDistributionTimeScaleTabChange?: (value: 'day' | 'week' | 'month') => void
  regularityPerformanceData: EntityPerformance[]
  regularityTimeTrendData: MonthlyTrendPoint[]
  isRegularityTimeTrendLoading?: boolean
  blockTableData: EntityPerformance[]
  supplySubmissionRateData: EntityPerformance[]
  supplySubmissionRateLabel: string
  operatorsPerformanceTable: PumpOperatorPerformanceData[]
  pumpOperatorsTotal: number
  childEntityLabel?: string
  onReachSchemePerformanceEnd?: () => void
}

type ViewBy = 'geography' | 'time'

export function DistrictDashboardScreen({
  data,
  waterSupplyOutagesData = data.waterSupplyOutages,
  waterSupplyOutageDistributionData = data.waterSupplyOutages,
  quantityPerformanceData,
  quantityTimeTrendData,
  isQuantityTimeTrendLoading = false,
  isQuantityTimeTrendAwaitingParams = false,
  quantityTimeScaleTab,
  onQuantityTimeScaleTabChange,
  regularityTimeScaleTab,
  onRegularityTimeScaleTabChange,
  outageDistributionTimeScaleTab,
  onOutageDistributionTimeScaleTabChange,
  regularityPerformanceData,
  regularityTimeTrendData,
  isRegularityTimeTrendLoading = false,
  supplySubmissionRateData,
  supplySubmissionRateLabel,
  operatorsPerformanceTable,
  pumpOperatorsTotal,
  childEntityLabel = supplySubmissionRateLabel,
  onReachSchemePerformanceEnd,
}: DistrictDashboardScreenProps) {
  const { t } = useTranslation('dashboard')
  const [quantityViewBy, setQuantityViewBy] = useState<ViewBy>('geography')
  const [regularityViewBy, setRegularityViewBy] = useState<ViewBy>('geography')
  const [outageDistributionViewBy, setOutageDistributionViewBy] = useState<ViewBy>('geography')
  const outageDistributionTimeTrendData = useMemo(
    () => data.supplyOutageTrend ?? [],
    [data.supplyOutageTrend]
  )
  const {
    hasOutageReasonsData,
    hasGeographyData,
    hasTimeTrendData,
    isOutageDistributionSelectDisabled,
  } = useOutageDistributionState({
    waterSupplyOutagesData,
    outageDistributionViewBy,
    waterSupplyOutageDistributionData,
    outageDistributionTimeTrendData,
  })
  const outageTimeXAxisLabel = getOutageTimeScaleXAxisLabel(outageDistributionTimeScaleTab, t)
  return (
    <>
      {/* Regularity + Quantity */}
      <Grid templateColumns="1fr" gap={6} mb={6}>
        <PerformanceChartCard
          title={t('performanceCharts.regularity.title', {
            defaultValue: 'Regularity Performance',
          })}
          viewByAriaLabel={t('performanceCharts.regularity.ariaViewByDistrict', {
            defaultValue: 'District regularity performance view by',
          })}
          viewBy={regularityViewBy}
          onViewByChange={setRegularityViewBy}
          data={regularityPerformanceData}
          metric="regularity"
          timeTrendData={regularityTimeTrendData}
          isTimeTrendLoading={isRegularityTimeTrendLoading}
          entityLabel={childEntityLabel}
          yAxisLabel={t('performanceCharts.regularity.yAxisLabel', {
            defaultValue: 'Regularity',
          })}
          seriesName={t('performanceCharts.regularity.seriesName', {
            defaultValue: 'Regularity',
          })}
          cardHeight="523px"
          timeXAxisLabel={t('performanceCharts.viewBy.month', { defaultValue: 'Month' })}
          isTimeTrendPercent
          regularityTimeScaleTab={regularityTimeScaleTab}
          onRegularityTimeScaleTabChange={onRegularityTimeScaleTabChange}
          selectColor="primary.500"
          selectBorderColor="primary.500"
        />
        <PerformanceChartCard
          title={t('performanceCharts.quantity.title', { defaultValue: 'Quantity Performance' })}
          viewByAriaLabel={t('performanceCharts.quantity.ariaViewByDistrict', {
            defaultValue: 'District quantity performance view by',
          })}
          viewBy={quantityViewBy}
          onViewByChange={setQuantityViewBy}
          data={quantityPerformanceData}
          metric="quantity"
          timeTrendData={quantityTimeTrendData}
          isTimeTrendLoading={isQuantityTimeTrendLoading}
          isTimeTrendAwaitingParams={isQuantityTimeTrendAwaitingParams}
          entityLabel={childEntityLabel}
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
          quantityTimeScaleTab={quantityTimeScaleTab}
          onQuantityTimeScaleTabChange={onQuantityTimeScaleTabChange}
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
            <Flex
              align="center"
              gap="8px"
              sx={{
                '@media (max-width: 525px)': {
                  flexDirection: 'column-reverse',
                  alignItems: 'flex-end',
                  gap: '6px',
                },
              }}
            >
              {outageDistributionViewBy === 'time' &&
              outageDistributionTimeScaleTab &&
              onOutageDistributionTimeScaleTabChange ? (
                <OutageTimeScaleToggle
                  value={outageDistributionTimeScaleTab}
                  onChange={onOutageDistributionTimeScaleTabChange}
                  ariaLabel={t('outageAndSubmissionCharts.ariaOutageTimeScale', {
                    defaultValue: 'Outage time scale',
                  })}
                />
              ) : null}
              <ViewBySelect
                ariaLabel={t('outageAndSubmissionCharts.ariaViewByDistrict', {
                  defaultValue: 'District supply outage distribution view by',
                })}
                value={outageDistributionViewBy}
                onChange={(value) => {
                  if (
                    value === 'time' &&
                    onOutageDistributionTimeScaleTabChange &&
                    !outageDistributionTimeScaleTab
                  ) {
                    onOutageDistributionTimeScaleTabChange('day')
                  }
                  setOutageDistributionViewBy(value)
                }}
                color="primary.500"
                borderColor="primary.500"
                disabled={isOutageDistributionSelectDisabled}
              />
            </Flex>
          </Flex>
          {!hasOutageReasonsData ? (
            <ChartEmptyState minHeight="400px" />
          ) : outageDistributionViewBy === 'geography' ? (
            hasGeographyData ? (
              <SupplyOutageDistributionChart
                data={waterSupplyOutageDistributionData}
                height="400px"
                xAxisLabel={childEntityLabel}
              />
            ) : (
              <ChartEmptyState minHeight="400px" />
            )
          ) : hasTimeTrendData ? (
            <MonthlyTrendChart
              data={outageDistributionTimeTrendData}
              height="400px"
              xAxisLabel={outageTimeXAxisLabel}
              yAxisLabel={t('outageAndSubmissionCharts.axis.noOfReasons', {
                defaultValue: 'No. of days',
              })}
              seriesName="Supply outage"
            />
          ) : (
            <ChartEmptyState minHeight="400px" />
          )}
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
          <Text textStyle="bodyText3" fontWeight="400">
            {t('outageAndSubmissionCharts.titles.readingSubmissionRate', {
              defaultValue: 'Reading Submission Rate',
            })}
          </Text>
          <Box flex="1" minH={0}>
            {supplySubmissionRateData.length > 0 ? (
              <ReadingSubmissionRateChart
                data={supplySubmissionRateData}
                height="100%"
                entityLabel={supplySubmissionRateLabel}
              />
            ) : (
              <ChartEmptyState minHeight="100%" />
            )}
          </Box>
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
        >
          <SchemePerformanceTable
            title={t('pumpOperators.performanceTable.title', {
              defaultValue: 'Scheme Performance',
            })}
            data={operatorsPerformanceTable}
            fillHeight
            showVillageColumn={false}
            blockColumnLabel={childEntityLabel}
            onReachEnd={onReachSchemePerformanceEnd}
          />
        </Box>
      </Grid>
    </>
  )
}
