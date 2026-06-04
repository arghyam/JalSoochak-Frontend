import { Box, Flex, Text } from '@chakra-ui/react'
import { ChartEmptyState, LoadingSpinner, ViewBySelect } from '@/shared/components/common'
import type { ViewByValue } from '@/shared/components/common/view-by-select'
import { MetricPerformanceChart, MonthlyTrendChart } from '../charts'
import type { MonthlyTrendPoint } from '../charts/monthly-trend-chart'
import type { EntityPerformance } from '../../types'

type PerformanceMetric = 'quantity' | 'regularity'
type PerformanceTimeScale = 'day' | 'week' | 'month' | 'quarter' | 'year'

type PerformanceChartCardProps = {
  title: string
  viewByAriaLabel: string
  viewBy: ViewByValue
  onViewByChange: (value: ViewByValue) => void
  data: EntityPerformance[]
  isGeographyLoading?: boolean
  isGeographyError?: boolean
  metric: PerformanceMetric
  timeTrendData: MonthlyTrendPoint[]
  isTimeTrendLoading?: boolean
  isTimeTrendError?: boolean
  isTimeTrendAwaitingParams?: boolean
  errorMessage?: string
  entityLabel: string
  yAxisLabel: string
  seriesName: string
  cardHeight: string
  showAreaLine?: boolean
  areaSeriesName?: string
  timeXAxisLabel?: string
  timeYAxisLabel?: string
  isTimeTrendPercent?: boolean
  selectColor?: string
  selectBorderColor?: string
  quantityTimeScaleTab?: PerformanceTimeScale
  onQuantityTimeScaleTabChange?: (value: PerformanceTimeScale) => void
  regularityTimeScaleTab?: PerformanceTimeScale
  onRegularityTimeScaleTabChange?: (value: PerformanceTimeScale) => void
  dateFormat?: string
  enableExtendedTimeScales?: boolean
  hideViewBySelect?: boolean
  isTimeViewEnabled?: boolean
}

export function PerformanceChartCard({
  title,
  viewByAriaLabel,
  viewBy,
  onViewByChange,
  data,
  isGeographyLoading = false,
  isGeographyError = false,
  metric,
  timeTrendData,
  isTimeTrendLoading = false,
  isTimeTrendError = false,
  isTimeTrendAwaitingParams = false,
  errorMessage,
  entityLabel,
  yAxisLabel,
  seriesName,
  cardHeight,
  showAreaLine = false,
  areaSeriesName = 'Demand',
  timeXAxisLabel = 'Month',
  timeYAxisLabel,
  isTimeTrendPercent = false,
  selectColor,
  selectBorderColor,
  quantityTimeScaleTab,
  onQuantityTimeScaleTabChange,
  regularityTimeScaleTab,
  onRegularityTimeScaleTabChange,
  dateFormat,
  enableExtendedTimeScales = true,
  hideViewBySelect = false,
  isTimeViewEnabled = true,
}: PerformanceChartCardProps) {
  const effectiveViewBy = isTimeViewEnabled ? viewBy : 'geography'
  const hasGeographyData = data.length > 0
  const hasTimeData = timeTrendData.length > 0
  const isSelectDisabled =
    effectiveViewBy === 'geography'
      ? !hasGeographyData
      : !hasTimeData && !isTimeTrendLoading && !isTimeTrendAwaitingParams
  const timeScaleTab = metric === 'quantity' ? quantityTimeScaleTab : regularityTimeScaleTab
  const onTimeScaleTabChange =
    metric === 'quantity' ? onQuantityTimeScaleTabChange : onRegularityTimeScaleTabChange
  const hasTimeScaleControl = Boolean(timeScaleTab && onTimeScaleTabChange)
  const metricTimeXAxisLabel =
    timeScaleTab === 'day'
      ? 'Day'
      : timeScaleTab === 'week'
        ? 'Week'
        : timeScaleTab === 'month'
          ? 'Month'
          : timeScaleTab === 'quarter'
            ? 'Quarter'
            : 'Year'
  const timeScaleItems: Array<{ key: PerformanceTimeScale; label: string }> =
    enableExtendedTimeScales
      ? [
          { key: 'day', label: 'D' },
          { key: 'week', label: 'W' },
          { key: 'month', label: 'M' },
          { key: 'quarter', label: 'Q' },
          { key: 'year', label: 'Y' },
        ]
      : [
          { key: 'day', label: 'D' },
          { key: 'week', label: 'W' },
          { key: 'month', label: 'M' },
        ]
  const resolvedTimeXAxisLabel =
    (metric === 'quantity' || metric === 'regularity') &&
    effectiveViewBy === 'time' &&
    hasTimeScaleControl
      ? metricTimeXAxisLabel
      : timeXAxisLabel

  return (
    <Box
      bg="white"
      borderWidth="0.5px"
      borderRadius="12px"
      borderColor="#E4E4E7"
      px="16px"
      pt="24px"
      pb="24px"
      h={cardHeight}
      minW={0}
      display="flex"
      flexDirection="column"
    >
      <Flex align="center" justify="space-between" mb="16px">
        <Text textStyle="bodyText3" fontWeight="400">
          {title}
        </Text>
        <Flex
          align="center"
          gap="8px"
          sx={{
            '@media (max-width: 767px)': {
              flexDirection: 'column-reverse',
              alignItems: 'flex-end',
              gap: '6px',
            },
          }}
        >
          {(metric === 'quantity' || metric === 'regularity') &&
          effectiveViewBy === 'time' &&
          hasTimeScaleControl ? (
            <Flex
              align="center"
              bg="#F4F4F5"
              borderRadius="999px"
              p="4px"
              gap="4px"
              aria-label={`${metric} time scale tabs`}
              sx={{
                '@media (max-width: 767px)': {
                  p: '2px',
                  gap: '2px',
                },
              }}
            >
              {timeScaleItems.map((item) => {
                const isActive = timeScaleTab === item.key
                return (
                  <Box
                    as="button"
                    key={item.key}
                    type="button"
                    h="32px"
                    minW="44px"
                    px="12px"
                    borderRadius="999px"
                    bg={isActive ? 'white' : 'transparent'}
                    color="neutral.900"
                    textStyle="bodyText5"
                    fontWeight={isActive ? '600' : '500'}
                    onClick={() => onTimeScaleTabChange?.(item.key)}
                    sx={{
                      '@media (max-width: 767px)': {
                        h: '26px',
                        minW: '34px',
                        px: '8px',
                        fontSize: '12px',
                        lineHeight: '16px',
                      },
                    }}
                  >
                    {item.label}
                  </Box>
                )
              })}
            </Flex>
          ) : null}
          {hideViewBySelect ? null : (
            <ViewBySelect
              ariaLabel={viewByAriaLabel}
              value={effectiveViewBy}
              onChange={(value) => {
                if (value === 'time' && !isTimeViewEnabled) {
                  return
                }
                if (value === 'time' && onTimeScaleTabChange) {
                  onTimeScaleTabChange('day')
                }
                onViewByChange(value)
              }}
              color={selectColor}
              borderColor={selectBorderColor}
              disabled={isSelectDisabled}
              isTimeOptionDisabled={!isTimeViewEnabled}
            />
          )}
        </Flex>
      </Flex>
      <Box flex="1" minH={0}>
        {effectiveViewBy === 'geography' && isGeographyLoading ? (
          <Flex align="center" justify="center" h="100%">
            <LoadingSpinner />
          </Flex>
        ) : effectiveViewBy === 'geography' && isGeographyError ? (
          <ChartEmptyState minHeight="100%" message={errorMessage} />
        ) : effectiveViewBy === 'geography' ? (
          data.length > 0 ? (
            <MetricPerformanceChart
              data={data}
              metric={metric}
              height="100%"
              entityLabel={entityLabel}
              yAxisLabel={yAxisLabel}
              seriesName={seriesName}
              {...(showAreaLine
                ? {
                    showAreaLine: true,
                    areaSeriesName,
                  }
                : {})}
            />
          ) : (
            <ChartEmptyState minHeight="100%" />
          )
        ) : isTimeTrendLoading ? (
          <Flex align="center" justify="center" h="100%">
            <LoadingSpinner />
          </Flex>
        ) : isTimeTrendError ? (
          <ChartEmptyState minHeight="100%" message={errorMessage} />
        ) : timeTrendData.length > 0 ? (
          <MonthlyTrendChart
            data={timeTrendData}
            height="100%"
            isPercent={isTimeTrendPercent}
            xAxisLabel={resolvedTimeXAxisLabel}
            yAxisLabel={timeYAxisLabel ?? yAxisLabel}
            seriesName={seriesName}
            dateFormat={dateFormat}
          />
        ) : isTimeTrendAwaitingParams ? null : (
          <ChartEmptyState minHeight="100%" />
        )}
      </Box>
    </Box>
  )
}
