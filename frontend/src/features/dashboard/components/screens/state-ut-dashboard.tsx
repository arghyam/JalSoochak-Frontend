import { useMemo } from 'react'
import { Box, Flex, Grid, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { DashboardData, EntityPerformance } from '../../types'
import { ReadingSubmissionRateChart } from '../charts'
import { ReadingSubmissionStatusCard } from './reading-submission-status-card'
import { ChartEmptyState, ChartInfoTooltip, LoadingSpinner } from '@/shared/components/common'
import { buildDashboardGlossary } from '../../utils/dashboard-glossary'

type StateUtDashboardScreenProps = {
  data: DashboardData
  supplySubmissionRateData: EntityPerformance[]
  supplySubmissionRateLabel: string
  isReadingSubmissionRateLoading?: boolean
  isReadingSubmissionStatusLoading?: boolean
  isReadingSubmissionRateError?: boolean
  isReadingSubmissionStatusError?: boolean
  screenDateFormat?: string
  errorMessage?: string
}

export function StateUtDashboardScreen({
  data,
  supplySubmissionRateData,
  supplySubmissionRateLabel,
  isReadingSubmissionRateLoading = false,
  isReadingSubmissionStatusLoading = false,
  isReadingSubmissionRateError = false,
  isReadingSubmissionStatusError = false,
  screenDateFormat,
  errorMessage = 'Failed to load data. Please reload the page.',
}: StateUtDashboardScreenProps) {
  const { t } = useTranslation('dashboard')
  const glossary = useMemo(() => buildDashboardGlossary(t), [t])

  return (
    <>
      {/* Reading Submission Status + Submission Rate */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={6} mb={6}>
        <ReadingSubmissionStatusCard
          data={data.readingSubmissionStatus}
          isLoading={isReadingSubmissionStatusLoading}
          errorMessage={isReadingSubmissionStatusError ? errorMessage : undefined}
          chartHeight="336px"
          boxProps={{ borderWidth: '1px', borderRadius: 'lg', px: 4, py: 6 }}
          tooltipContent={glossary.readingSubmissionStatus}
        />
        <Box
          bg="white"
          borderWidth="1px"
          borderRadius="lg"
          px={4}
          py={6}
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
              ariaLabel="Reading submission rate info"
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
                dateFormat={screenDateFormat}
              />
            ) : (
              <ChartEmptyState minHeight="100%" />
            )}
          </Box>
        </Box>
      </Grid>
    </>
  )
}
