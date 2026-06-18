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
import {
  ChartEmptyState,
  ChartInfoTooltip,
  LoadingSpinner,
  ViewBySelect,
} from '@/shared/components/common'
import { buildDashboardGlossary } from '../../utils/dashboard-glossary'
import type { MonthlyTrendPoint } from '../charts/monthly-trend-chart'
import { useOutageDistributionState } from './use-outage-distribution-state'
import { getOutageTimeScaleXAxisLabel, OutageTimeScaleToggle } from './outage-time-scale-toggle'
import { shouldShowSupplyOutageCharts } from '@/config/server-config'

type BlockDashboardScreenProps = {
  data: DashboardData
  waterSupplyOutagesData?: WaterSupplyOutageData[]
  waterSupplyOutageDistributionData?: WaterSupplyOutageData[]
  quantityPerformanceData: EntityPerformance[]
  isQuantityPerformanceLoading?: boolean
  isQuantityPerformanceError?: boolean
  quantityTimeTrendData: MonthlyTrendPoint[]
  isQuantityTimeTrendLoading?: boolean
  isQuantityTimeTrendError?: boolean
  isQuantityTimeTrendAwaitingParams?: boolean
  quantityTimeScaleTab?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  onQuantityTimeScaleTabChange?: (value: 'day' | 'week' | 'month' | 'quarter' | 'year') => void
  regularityTimeScaleTab?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  onRegularityTimeScaleTabChange?: (value: 'day' | 'week' | 'month' | 'quarter' | 'year') => void
  outageDistributionTimeScaleTab?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  onOutageDistributionTimeScaleTabChange?: (
    value: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ) => void
  regularityPerformanceData: EntityPerformance[]
  isRegularityPerformanceLoading?: boolean
  isRegularityPerformanceError?: boolean
  regularityTimeTrendData: MonthlyTrendPoint[]
  isRegularityTimeTrendLoading?: boolean
  isRegularityTimeTrendError?: boolean
  gramPanchayatTableData: EntityPerformance[]
  supplySubmissionRateData: EntityPerformance[]
  supplySubmissionRateLabel: string
  pumpOperatorsTotal: number
  operatorsPerformanceTable: PumpOperatorPerformanceData[]
  isOutageReasonsLoading?: boolean
  isOutageDistributionLoading?: boolean
  isReadingSubmissionRateLoading?: boolean
  isReadingSubmissionStatusLoading?: boolean
  isSchemePerformanceLoading?: boolean
  isActiveSchemesLoading?: boolean
  isReadingSubmissionRateError?: boolean
  isReadingSubmissionStatusError?: boolean
  isSchemePerformanceError?: boolean
  isActiveSchemesError?: boolean
  childEntityLabel?: string
  errorMessage?: string
  showSupplyOutageReasons?: boolean
  showReadingSubmissionRate?: boolean
  showReadingSubmissionSection?: boolean
  isSchemeDownloading?: boolean
  onSchemeDownload?: () => void
  onSchemePageChange?: (page: number) => void
  onSchemeSortChange?: (sortBy: string, sortDir: 'asc' | 'desc') => void
  schemePerformancePage?: number
  schemeSortBy?: string
  schemeSortDir?: 'asc' | 'desc'
  totalSchemePages?: number
  screenDateFormat?: string
  tableDateFormat?: string
  isTimeViewEnabled?: boolean
}

type ViewBy = 'geography' | 'time'

export function BlockDashboardScreen({
  data,
  waterSupplyOutagesData = data.waterSupplyOutages,
  waterSupplyOutageDistributionData = data.waterSupplyOutages,
  quantityPerformanceData,
  isQuantityPerformanceLoading = false,
  isQuantityPerformanceError = false,
  quantityTimeTrendData,
  isQuantityTimeTrendLoading = false,
  isQuantityTimeTrendError = false,
  isQuantityTimeTrendAwaitingParams = false,
  quantityTimeScaleTab,
  onQuantityTimeScaleTabChange,
  regularityTimeScaleTab,
  onRegularityTimeScaleTabChange,
  outageDistributionTimeScaleTab,
  onOutageDistributionTimeScaleTabChange,
  regularityPerformanceData,
  isRegularityPerformanceLoading = false,
  isRegularityPerformanceError = false,
  regularityTimeTrendData,
  isRegularityTimeTrendLoading = false,
  isRegularityTimeTrendError = false,
  supplySubmissionRateData,
  supplySubmissionRateLabel,
  pumpOperatorsTotal,
  operatorsPerformanceTable,
  isOutageReasonsLoading = false,
  isOutageDistributionLoading = false,
  isReadingSubmissionRateLoading = false,
  isReadingSubmissionStatusLoading = false,
  isSchemePerformanceLoading = false,
  isActiveSchemesLoading = false,
  isReadingSubmissionRateError = false,
  isReadingSubmissionStatusError = false,
  isSchemePerformanceError = false,
  isActiveSchemesError = false,
  childEntityLabel = supplySubmissionRateLabel,
  errorMessage = 'Failed to load data. Please reload the page.',
  showSupplyOutageReasons = true,
  showReadingSubmissionRate = true,
  showReadingSubmissionSection = true,
  isSchemeDownloading,
  onSchemeDownload,
  onSchemePageChange,
  onSchemeSortChange,
  schemePerformancePage,
  schemeSortBy,
  schemeSortDir,
  totalSchemePages,
  screenDateFormat,
  tableDateFormat,
  isTimeViewEnabled = true,
}: BlockDashboardScreenProps) {
  const { t } = useTranslation('dashboard')
  const glossary = useMemo(() => buildDashboardGlossary(t), [t])
  const showSupplyOutageCharts = shouldShowSupplyOutageCharts()
  const [quantityViewBy, setQuantityViewBy] = useState<ViewBy>('geography')
  const [regularityViewBy, setRegularityViewBy] = useState<ViewBy>('geography')
  const [outageDistributionViewBy, setOutageDistributionViewBy] = useState<ViewBy>('geography')
  const effectiveOutageDistributionViewBy = isTimeViewEnabled
    ? outageDistributionViewBy
    : 'geography'
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
    outageDistributionViewBy: effectiveOutageDistributionViewBy,
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
          tooltipContent={glossary.regularityPerformance}
          viewByAriaLabel={t('performanceCharts.regularity.ariaViewByBlock', {
            defaultValue: 'Block regularity performance view by',
          })}
          viewBy={regularityViewBy}
          onViewByChange={setRegularityViewBy}
          data={regularityPerformanceData}
          isGeographyLoading={isRegularityPerformanceLoading}
          isGeographyError={isRegularityPerformanceError}
          metric="regularity"
          timeTrendData={regularityTimeTrendData}
          isTimeTrendLoading={isRegularityTimeTrendLoading}
          isTimeTrendError={isRegularityTimeTrendError}
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
          dateFormat={screenDateFormat ?? tableDateFormat}
          isTimeViewEnabled={isTimeViewEnabled}
          errorMessage={errorMessage}
        />
        <PerformanceChartCard
          title={t('performanceCharts.quantity.title', { defaultValue: 'Quantity Performance' })}
          tooltipContent={glossary.quantityPerformance}
          viewByAriaLabel={t('performanceCharts.quantity.ariaViewByBlock', {
            defaultValue: 'Block quantity performance view by',
          })}
          viewBy={quantityViewBy}
          onViewByChange={setQuantityViewBy}
          data={quantityPerformanceData}
          isGeographyLoading={isQuantityPerformanceLoading}
          isGeographyError={isQuantityPerformanceError}
          metric="quantity"
          timeTrendData={quantityTimeTrendData}
          isTimeTrendLoading={isQuantityTimeTrendLoading}
          isTimeTrendError={isQuantityTimeTrendError}
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
          dateFormat={screenDateFormat ?? tableDateFormat}
          isTimeViewEnabled={isTimeViewEnabled}
          errorMessage={errorMessage}
        />
      </Grid>

      {/* Supply outage charts temporarily hidden; set SHOW_SUPPLY_OUTAGE_CHARTS to true to restore. */}
      {showSupplyOutageCharts ? (
        <Grid
          templateColumns={{
            base: '1fr',
            lg: showSupplyOutageReasons ? 'repeat(2, minmax(0, 1fr))' : '1fr',
          }}
          gap={6}
          mb={6}
        >
          {showSupplyOutageReasons ? (
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
              {isOutageReasonsLoading ? (
                <Flex align="center" justify="center" h="400px">
                  <LoadingSpinner />
                </Flex>
              ) : (
                <SupplyOutageReasonsChart
                  data={waterSupplyOutagesData}
                  height="400px"
                  tooltipContent={glossary.supplyOutageReasons}
                />
              )}
            </Box>
          ) : null}
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
              <Flex align="center" gap="6px">
                <Text textStyle="bodyText3" fontWeight="400">
                  {t('outageAndSubmissionCharts.titles.supplyOutageDistribution', {
                    defaultValue: 'Supply Outage Distribution',
                  })}
                </Text>
                <ChartInfoTooltip
                  tooltipContent={glossary.supplyOutageDistribution}
                  ariaLabel={t('outageAndSubmissionCharts.ariaSupplyOutageDistribution', {
                    defaultValue: 'Supply outage distribution info',
                  })}
                />
              </Flex>
              <Flex
                align="center"
                gap="8px"
                sx={{
                  '@media (max-width: 1279px)': {
                    flexDirection: 'column-reverse',
                    alignItems: 'flex-end',
                    gap: '6px',
                  },
                }}
              >
                {effectiveOutageDistributionViewBy === 'time' &&
                isTimeViewEnabled &&
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
                  ariaLabel={t('outageAndSubmissionCharts.ariaViewByBlock', {
                    defaultValue: 'Block supply outage distribution view by',
                  })}
                  value={effectiveOutageDistributionViewBy}
                  onChange={(value) => {
                    if (value === 'time' && !isTimeViewEnabled) {
                      return
                    }
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
                  isTimeOptionDisabled={!isTimeViewEnabled}
                />
              </Flex>
            </Flex>
            {isOutageDistributionLoading ? (
              <Flex align="center" justify="center" h="400px">
                <LoadingSpinner />
              </Flex>
            ) : !hasOutageReasonsData ? (
              <ChartEmptyState minHeight="400px" />
            ) : effectiveOutageDistributionViewBy === 'geography' ? (
              hasGeographyData ? (
                <SupplyOutageDistributionChart
                  data={waterSupplyOutageDistributionData}
                  height="400px"
                  xAxisLabel={childEntityLabel}
                  dateFormat={screenDateFormat ?? tableDateFormat}
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
                seriesName={t('outageAndSubmissionCharts.series.supplyOutage', {
                  defaultValue: 'Supply outage',
                })}
                dateFormat={screenDateFormat ?? tableDateFormat}
              />
            ) : (
              <ChartEmptyState minHeight="400px" />
            )}
          </Box>
        </Grid>
      ) : null}

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
            <Flex align="center" gap="6px">
              <Text textStyle="bodyText3" fontWeight="400">
                {t('pumpOperators.title', { defaultValue: 'Active Schemes' })}
              </Text>
              <ChartInfoTooltip
                tooltipContent={glossary.activeSchemes}
                ariaLabel={t('outageAndSubmissionCharts.ariaActiveSchemes', {
                  defaultValue: 'Active schemes info',
                })}
              />
            </Flex>
            <Text textStyle="bodyText3" fontWeight="400">
              {t('pumpOperators.totalLabel', { defaultValue: 'Total' })}: {pumpOperatorsTotal}
            </Text>
          </Flex>
          {isActiveSchemesLoading ? (
            <Flex align="center" justify="center" h="360px">
              <LoadingSpinner />
            </Flex>
          ) : isActiveSchemesError ? (
            <ChartEmptyState minHeight="360px" message={errorMessage} />
          ) : (
            <ActiveSchemesChart data={data.pumpOperators} height="360px" />
          )}
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
              defaultValue: 'Schemes Performance',
            })}
            data={operatorsPerformanceTable}
            isLoading={isSchemePerformanceLoading}
            errorMessage={isSchemePerformanceError ? errorMessage : undefined}
            fillHeight
            secondaryColumnLabel={childEntityLabel}
            showBlockColumn={false}
            currentPage={schemePerformancePage}
            totalPages={totalSchemePages}
            onPageChange={onSchemePageChange}
            tooltipContent={glossary.schemePerformance}
            sortBy={schemeSortBy}
            sortDir={schemeSortDir}
            onSortChange={onSchemeSortChange}
            onDownload={onSchemeDownload}
            isDownloading={isSchemeDownloading}
          />
        </Box>
      </Grid>

      {/* Reading Submission Status + Reading Submission Rate */}
      {showReadingSubmissionSection ? (
        <Grid
          templateColumns={{
            base: '1fr',
            lg: showReadingSubmissionRate ? 'repeat(2, minmax(0, 1fr))' : '1fr',
          }}
          gap={6}
          mb={6}
        >
          <ReadingSubmissionStatusCard
            data={data.readingSubmissionStatus}
            isLoading={isReadingSubmissionStatusLoading}
            errorMessage={isReadingSubmissionStatusError ? errorMessage : undefined}
            chartHeight="336px"
            tooltipContent={glossary.readingSubmissionStatus}
          />
          {showReadingSubmissionRate ? (
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
              <Flex align="center" gap="6px" mb={2}>
                <Text textStyle="bodyText3" fontWeight="400">
                  {t('outageAndSubmissionCharts.titles.readingSubmissionRate', {
                    defaultValue: 'Reading Submission Rate',
                  })}
                </Text>
                <ChartInfoTooltip
                  tooltipContent={glossary.readingSubmissionRate}
                  ariaLabel={t('outageAndSubmissionCharts.ariaReadingSubmissionRate', {
                    defaultValue: 'Reading submission rate info',
                  })}
                />
              </Flex>
              <Box flex="1" minH={0}>
                {isReadingSubmissionRateLoading ? (
                  <Flex align="center" justify="center" h="100%">
                    <LoadingSpinner />
                  </Flex>
                ) : isReadingSubmissionRateError ? (
                  <ChartEmptyState minHeight="100%" message={errorMessage} />
                ) : supplySubmissionRateData.length > 0 ? (
                  <ReadingSubmissionRateChart
                    data={supplySubmissionRateData}
                    height="100%"
                    entityLabel={supplySubmissionRateLabel}
                    dateFormat={screenDateFormat ?? tableDateFormat}
                  />
                ) : (
                  <ChartEmptyState minHeight="100%" />
                )}
              </Box>
            </Box>
          ) : null}
        </Grid>
      ) : null}
    </>
  )
}
