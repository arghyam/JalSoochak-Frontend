import { Box, Grid, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { DashboardData, WaterSupplyOutageData } from '../../types'
import { DemandSupplyChart, ImageSubmissionStatusChart, IssueTypeBreakdownChart } from '../charts'
import { PhotoEvidenceComplianceTable } from '../tables'

type VillageDashboardScreenProps = {
  data: DashboardData
  villagePhotoEvidenceRows: DashboardData['photoEvidenceCompliance']
  waterSupplyOutagesData: WaterSupplyOutageData[]
}

export function VillageDashboardScreen({
  data,
  villagePhotoEvidenceRows,
  waterSupplyOutagesData,
}: VillageDashboardScreenProps) {
  const { t } = useTranslation('dashboard')

  return (
    <>
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="536px">
          <PhotoEvidenceComplianceTable data={villagePhotoEvidenceRows} showVillageColumn={false} />
        </Box>
        <Box bg="white" borderWidth="1px" borderRadius="lg" p={4} h="536px">
          <Text textStyle="bodyText3" fontWeight="400" mb={2}>
            Demand vs Supply
          </Text>
          <DemandSupplyChart data={data.demandSupply} height="418px" />
        </Box>
      </Grid>
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        <Box
          bg="white"
          borderWidth="0.5px"
          borderRadius="12px"
          borderColor="#E4E4E7"
          pt="24px"
          pb="24px"
          pl="16px"
          pr="16px"
          h="523px"
          w="full"
          minW={0}
        >
          <Text textStyle="bodyText3" fontWeight="400" mb="0px">
            Image Submission Status
          </Text>
          <ImageSubmissionStatusChart data={data.imageSubmissionStatus} height="406px" />
        </Box>
        <Box
          bg="white"
          borderWidth="0.5px"
          borderRadius="12px"
          borderColor="#E4E4E7"
          pt="24px"
          pb="24px"
          pl="16px"
          pr="16px"
          h="523px"
          w="full"
          minW={0}
        >
          <Text textStyle="bodyText3" fontWeight="400" mb={2}>
            {t('outageAndSubmissionCharts.titles.issueTypeBreakdown', {
              defaultValue: 'Issue Type Breakdown',
            })}
          </Text>
          <IssueTypeBreakdownChart data={waterSupplyOutagesData} height="400px" />
        </Box>
      </Grid>
    </>
  )
}
