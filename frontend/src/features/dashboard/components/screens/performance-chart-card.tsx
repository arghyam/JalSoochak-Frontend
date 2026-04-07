import { Box, Flex, Text } from '@chakra-ui/react'
import { ChartEmptyState, LoadingSpinner, ViewBySelect } from '@/shared/components/common'
import type { ViewByValue } from '@/shared/components/common/view-by-select'
import { MetricPerformanceChart, MonthlyTrendChart } from '../charts'
import type { MonthlyTrendPoint } from '../charts/monthly-trend-chart'
import type { EntityPerformance } from '../../types'

type PerformanceMetric = 'quantity' | 'regularity'

type PerformanceChartCardProps = {
  title: string
  viewByAriaLabel: string
  viewBy: ViewByValue
  onViewByChange: (value: ViewByValue) => void
  data: EntityPerformance[]
  metric: PerformanceMetric
  timeTrendData: MonthlyTrendPoint[]
  isTimeTrendLoading?: boolean
  isTimeTrendAwaitingParams?: boolean
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
  quantityTimeScaleTab?: 'day' | 'week' | 'month'
  onQuantityTimeScaleTabChange?: (value: 'day' | 'week' | 'month') => void
}

export function PerformanceChartCard({
  title,
  viewByAriaLabel,
  viewBy,
  onViewByChange,
  data,
  metric,
  timeTrendData,
  isTimeTrendLoading = false,
  isTimeTrendAwaitingParams = false,
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
  quantityTimeScaleTab = 'day',
  onQuantityTimeScaleTabChange,
}: PerformanceChartCardProps) {
  const hasGeographyData = data.length > 0
  const hasTimeData = timeTrendData.length > 0
  const isSelectDisabled =
    viewBy === 'geography'
      ? !hasGeographyData
      : !hasTimeData && !isTimeTrendLoading && !isTimeTrendAwaitingParams
  const quantityTimeXAxisLabel =
    quantityTimeScaleTab === 'day' ? 'Day' : quantityTimeScaleTab === 'week' ? 'Week' : 'Month'
  const resolvedTimeXAxisLabel =
    metric === 'quantity' && viewBy === 'time' ? quantityTimeXAxisLabel : timeXAxisLabel

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
        <Flex align="center" gap="8px">
          {metric === 'quantity' && viewBy === 'time' && onQuantityTimeScaleTabChange ? (
            <Flex
              align="center"
              bg="#F4F4F5"
              borderRadius="999px"
              p="4px"
              gap="4px"
              aria-label="Quantity time scale tabs"
            >
              {[
                { key: 'day', label: 'D' },
                { key: 'week', label: 'W' },
                { key: 'month', label: 'M' },
              ].map((item) => {
                const isActive = quantityTimeScaleTab === item.key
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
                    onClick={() =>
                      onQuantityTimeScaleTabChange(item.key as 'day' | 'week' | 'month')
                    }
                  >
                    {item.label}
                  </Box>
                )
              })}
            </Flex>
          ) : null}
          <ViewBySelect
            ariaLabel={viewByAriaLabel}
            value={viewBy}
            onChange={(value) => {
              if (metric === 'quantity' && value === 'time' && onQuantityTimeScaleTabChange) {
                onQuantityTimeScaleTabChange('day')
              }
              onViewByChange(value)
            }}
            color={selectColor}
            borderColor={selectBorderColor}
            disabled={isSelectDisabled}
          />
        </Flex>
      </Flex>
      <Box flex="1" minH={0}>
        {viewBy === 'geography' ? (
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
        ) : timeTrendData.length > 0 ? (
          <MonthlyTrendChart
            data={timeTrendData}
            height="100%"
            isPercent={isTimeTrendPercent}
            xAxisLabel={resolvedTimeXAxisLabel}
            yAxisLabel={timeYAxisLabel ?? yAxisLabel}
            seriesName={seriesName}
          />
        ) : isTimeTrendAwaitingParams ? null : (
          <ChartEmptyState minHeight="100%" />
        )}
      </Box>
    </Box>
  )
}
