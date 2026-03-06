import { Box, Grid, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { DashboardData, EntityPerformance } from '../../types'
import { ImageSubmissionStatusChart, SupplySubmissionRateChart } from '../charts'

type StateUtDashboardScreenProps = {
  data: DashboardData
  supplySubmissionRateData: EntityPerformance[]
  supplySubmissionRateLabel: string
}

export function StateUtDashboardScreen({
  data,
  supplySubmissionRateData,
  supplySubmissionRateLabel,
}: StateUtDashboardScreenProps) {
  const { t } = useTranslation('dashboard')

  return (
    <>
      {/* Reading Submission Status + Submission Rate */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={6} mb={6}>
        <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="510px" minW={0}>
          <Text textStyle="bodyText3" fontWeight="400" mb="16px">
            {t('outageAndSubmissionCharts.titles.readingSubmissionStatus', {
              defaultValue: 'Reading Submission Status',
            })}
          </Text>
          <ImageSubmissionStatusChart data={data.imageSubmissionStatus} height="336px" />
        </Box>
        <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="510px" minW={0}>
          <Text textStyle="bodyText3" fontWeight="400" mb={2}>
            {t('outageAndSubmissionCharts.titles.readingSubmissionRate', {
              defaultValue: 'Reading Submission Rate',
            })}
          </Text>
          <SupplySubmissionRateChart
            data={supplySubmissionRateData}
            height="383px"
            entityLabel={supplySubmissionRateLabel}
          />
        </Box>
      </Grid>
    </>
  )
}
