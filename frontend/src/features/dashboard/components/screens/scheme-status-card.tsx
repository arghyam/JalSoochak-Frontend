import { useState } from 'react'
import type { ReactNode } from 'react'
import { Box, Flex, Text, useMediaQuery } from '@chakra-ui/react'
import type { BoxProps } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { SchemeStatusDonutChart } from '../charts'
import { SchemeStatusDimensionToggle } from './scheme-status-dimension-toggle'
import { ChartEmptyState, ChartInfoTooltip, LoadingSpinner } from '@/shared/components/common'
import type { SchemeStatusCount, SchemeStatusDimension } from '@/shared/constants/scheme-status'

type SchemeStatusCardProps = {
  workStatusCounts: SchemeStatusCount[]
  operatingStatusCounts: SchemeStatusCount[]
  totalCount: number
  isLoading?: boolean
  errorMessage?: string
  chartHeight?: string | number
  cardHeight?: string | number
  boxProps?: BoxProps
  tooltipContent?: ReactNode
  defaultDimension?: SchemeStatusDimension
}

export function SchemeStatusCard({
  workStatusCounts,
  operatingStatusCounts,
  totalCount,
  isLoading = false,
  errorMessage,
  chartHeight = '336px',
  cardHeight = '510px',
  boxProps,
  tooltipContent,
  defaultDimension = 'operatingStatus',
}: SchemeStatusCardProps) {
  const { t } = useTranslation('dashboard')
  const [isBelowXs] = useMediaQuery('(max-width: 480px)')
  const resolvedCardHeight = isBelowXs ? 'auto' : cardHeight
  const resolvedChartHeight = isBelowXs ? 'auto' : chartHeight
  const [dimension, setDimension] = useState<SchemeStatusDimension>(defaultDimension)

  const title = t('pumpOperators.title', { defaultValue: 'Schemes by Status' })
  const totalLabel = t('pumpOperators.totalLabel', { defaultValue: 'Total' })
  const data = dimension === 'workStatus' ? workStatusCounts : operatingStatusCounts

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
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
        gap="12px"
        mb={isBelowXs ? '16px' : '40px'}
      >
        <Flex align="center" gap="6px">
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
        {!isLoading && !errorMessage ? (
          <SchemeStatusDimensionToggle
            value={dimension}
            onChange={setDimension}
            ariaLabel={t('pumpOperators.dimension.ariaLabel', {
              defaultValue: 'Scheme status breakdown',
            })}
          />
        ) : null}
        <Text textStyle="bodyText3" fontWeight="400">
          {totalLabel}: {totalCount}
        </Text>
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
        <SchemeStatusDonutChart dimension={dimension} data={data} height={resolvedChartHeight} />
      )}
    </Box>
  )
}
