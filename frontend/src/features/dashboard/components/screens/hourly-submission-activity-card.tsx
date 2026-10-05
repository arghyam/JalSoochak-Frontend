import { useMemo } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { ChartEmptyState, ChartInfoTooltip, LoadingSpinner } from '@/shared/components/common'
import type { HourlySubmissionActivityQueryParams } from '../../types'
import { useHourlySubmissionActivityQuery } from '../../services/query/use-hourly-submission-activity-query'
import { toSubmissionsByHourOfDay } from '../../utils/hourly-submission-activity'
import { HourlySubmissionChart } from '../charts/hourly-submission-chart'

type HourlySubmissionActivityCardProps = {
  params: HourlySubmissionActivityQueryParams | null
  errorMessage?: string
}

/** When readings arrive during the day, summed over the selected date range. */
export function HourlySubmissionActivityCard({
  params,
  errorMessage = 'Failed to load data. Please reload the page.',
}: HourlySubmissionActivityCardProps) {
  const { t } = useTranslation('dashboard')
  const { data, isLoading, isError } = useHourlySubmissionActivityQuery({ params })
  const submissionsByHour = useMemo(
    () => toSubmissionsByHourOfDay(data?.hourlyActivity),
    [data?.hourlyActivity]
  )
  const hasSubmissions = submissionsByHour.some((count) => count > 0)

  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderRadius="lg"
      px={4}
      py={6}
      h="420px"
      mb={6}
      minW={0}
      display="flex"
      flexDirection="column"
    >
      <Flex align="center" gap="6px" mb={2}>
        <Text textStyle="bodyText3" fontWeight="400">
          {t('outageAndSubmissionCharts.titles.hourlySubmissions', {
            defaultValue: 'Submissions by Hour of Day',
          })}
        </Text>
        <ChartInfoTooltip
          tooltipContent={t('outageAndSubmissionCharts.hourlySubmissions.tooltip', {
            defaultValue:
              'Readings submitted in each hour of the day (IST), added up over the selected dates. Shows when operators usually submit.',
          })}
          ariaLabel={t('outageAndSubmissionCharts.hourlySubmissions.ariaLabel', {
            defaultValue: 'Submissions by hour of day info',
          })}
        />
      </Flex>
      <Box flex="1" minH={0}>
        {isLoading ? (
          <Flex align="center" justify="center" h="100%">
            <LoadingSpinner />
          </Flex>
        ) : isError ? (
          <ChartEmptyState minHeight="100%" message={errorMessage} />
        ) : hasSubmissions ? (
          <HourlySubmissionChart submissionsByHour={submissionsByHour} height="100%" />
        ) : (
          <ChartEmptyState minHeight="100%" />
        )}
      </Box>
    </Box>
  )
}
