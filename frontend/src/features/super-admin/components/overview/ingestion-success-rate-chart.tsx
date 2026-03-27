import { Box, Heading } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { BarLineChart } from '@/shared/components/charts/bar-line-chart'
import type { IngestionDataPoint } from '../../types/overview'

interface IngestionSuccessRateChartProps {
  data: IngestionDataPoint[]
}

export function IngestionSuccessRateChart({ data }: IngestionSuccessRateChartProps) {
  const { t } = useTranslation('super-admin')

  return (
    <Box
      as="section"
      aria-labelledby="ingestion-chart-heading"
      bg="white"
      borderWidth="0.5px"
      borderColor="neutral.200"
      height={{ base: 'auto', md: '420px' }}
      borderRadius={{ base: '12px', md: '16px' }}
      boxShadow="default"
      py={{ base: 4, md: 6 }}
      px={4}
    >
      <Heading
        as="h2"
        id="ingestion-chart-heading"
        size="h3"
        fontWeight="400"
        mb={4}
        fontSize={{ base: 'md', md: 'xl' }}
      >
        {t('overview.charts.ingestionSuccessRate')}
      </Heading>
      <BarLineChart
        data={data}
        xKey="month"
        barKey="successfulIngestions"
        lineKey="failedIngestions"
        barColor="#3291D1"
        lineColor="#FFA100"
        height="326px"
        barLegendLabel={t('overview.charts.successfulIngestions')}
        lineLegendLabel={t('overview.charts.failedIngestions')}
      />
    </Box>
  )
}
