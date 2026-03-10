import { Box, Text } from '@chakra-ui/react'
import type { BoxProps } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { ReadingSubmissionStatusChart } from '../charts'
import type { ReadingSubmissionStatusData } from '../../types'

type ReadingSubmissionStatusCardProps = {
  data: ReadingSubmissionStatusData[]
  chartHeight?: string | number
  cardHeight?: string | number
  boxProps?: BoxProps
}

export function ReadingSubmissionStatusCard({
  data,
  chartHeight = '336px',
  cardHeight = '510px',
  boxProps,
}: ReadingSubmissionStatusCardProps) {
  const { t } = useTranslation('dashboard')

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
      {...boxProps}
    >
      <Text textStyle="bodyText3" fontWeight="400" mb="40px">
        {t('outageAndSubmissionCharts.titles.readingSubmissionStatus', {
          defaultValue: 'Reading Submission Status',
        })}
      </Text>
      <ReadingSubmissionStatusChart data={data} height={chartHeight} />
    </Box>
  )
}
