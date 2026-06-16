import type { ReactNode } from 'react'
import { Box, Flex, Text, useMediaQuery } from '@chakra-ui/react'
import type { BoxProps } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { ReadingSubmissionStatusChart } from '../charts'
import type { ReadingSubmissionStatusData } from '../../types'
import { ChartEmptyState, ChartInfoTooltip, LoadingSpinner } from '@/shared/components/common'

type ReadingSubmissionStatusCardProps = {
  data: ReadingSubmissionStatusData[]
  isLoading?: boolean
  errorMessage?: string
  chartHeight?: string | number
  cardHeight?: string | number
  boxProps?: BoxProps
  tooltipContent?: ReactNode
}

export function ReadingSubmissionStatusCard({
  data,
  isLoading = false,
  errorMessage,
  chartHeight = '336px',
  cardHeight = '510px',
  boxProps,
  tooltipContent,
}: ReadingSubmissionStatusCardProps) {
  const { t } = useTranslation('dashboard')
  const [isBelowXs] = useMediaQuery('(max-width: 480px)')
  const resolvedCardHeight = isBelowXs ? 'auto' : cardHeight
  const resolvedChartHeight = isBelowXs ? 'auto' : chartHeight
  const title = t('outageAndSubmissionCharts.titles.readingSubmissionStatus', {
    defaultValue: 'Reading Submission Status',
  })

  return (
    <Box
      bg="white"
      borderWidth="0.5px"
      borderRadius="12px"
      borderColor="#E4E4E7"
      px="16px"
      pt="24px"
      pb="24px"
      h={resolvedCardHeight}
      minW={0}
      {...boxProps}
    >
      <Flex align="center" gap="6px" mb={isBelowXs ? '24px' : '40px'}>
        <Text textStyle="bodyText3" fontWeight="400">
          {title}
        </Text>
        {tooltipContent ? (
          <ChartInfoTooltip
            tooltipContent={tooltipContent}
            ariaLabel={t('aria.chartInfo', { title, defaultValue: '{{title}} info' })}
          />
        ) : null}
      </Flex>
      {isLoading ? (
        <Box h={resolvedChartHeight} display="flex" alignItems="center" justifyContent="center">
          <LoadingSpinner />
        </Box>
      ) : errorMessage ? (
        <Box h={resolvedChartHeight}>
          <ChartEmptyState minHeight="100%" message={errorMessage} />
        </Box>
      ) : (
        <ReadingSubmissionStatusChart data={data} height={resolvedChartHeight} />
      )}
    </Box>
  )
}
