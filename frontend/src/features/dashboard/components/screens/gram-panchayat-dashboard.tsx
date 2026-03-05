import { Box, Flex, Grid, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { DashboardData, EntityPerformance, PumpOperatorPerformanceData } from '../../types'
import {
  AllStatesPerformanceChart,
  DemandSupplyChart,
  PumpOperatorsChart,
  SupplySubmissionRateChart,
} from '../charts'
import {
  AllGramPanchayatsTable,
  PhotoEvidenceComplianceTable,
  PumpOperatorsPerformanceTable,
} from '../tables'

type GramPanchayatDashboardScreenProps = {
  data: DashboardData
  villageTableData: EntityPerformance[]
  supplySubmissionRateData: EntityPerformance[]
  supplySubmissionRateLabel: string
  pumpOperatorsTotal: number
  operatorsPerformanceTable: PumpOperatorPerformanceData[]
}

export function GramPanchayatDashboardScreen({
  data,
  villageTableData,
  supplySubmissionRateData,
  supplySubmissionRateLabel,
  pumpOperatorsTotal,
  operatorsPerformanceTable,
}: GramPanchayatDashboardScreenProps) {
  const { t } = useTranslation('dashboard')

  return (
    <>
      {/* Performance + Demand vs Supply Charts */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }} gap={6} mb={6}>
        <Box
          bg="white"
          borderWidth="1px"
          borderRadius="lg"
          p={4}
          h="536px"
          w="full"
          minW="250px"
          justifySelf={{ base: 'center', md: 'stretch' }}
        >
          <Text textStyle="bodyText3" fontWeight="400">
            All Villages Performance
          </Text>
          <AllStatesPerformanceChart
            data={villageTableData}
            height="440px"
            entityLabel="Villages"
          />
        </Box>
        <Box bg="white" borderWidth="1px" borderRadius="lg" p={4} h="536px" minW={0}>
          <Text textStyle="bodyText3" fontWeight="400" mb={2}>
            Demand vs Supply
          </Text>
          <DemandSupplyChart data={data.demandSupply} height="418px" />
        </Box>
      </Grid>

      {/* Photo Evidence + Submission Rate */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="526px">
          <PhotoEvidenceComplianceTable data={data.photoEvidenceCompliance} />
        </Box>
        <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="526px">
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

      {/* All Villages + Pump Operators */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="510px">
          <Text textStyle="bodyText3" fontWeight="400" mb="16px">
            All Villages
          </Text>
          <AllGramPanchayatsTable data={villageTableData} nameColumnLabel="Village" />
        </Box>
        <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="510px">
          <Flex align="center" justify="space-between" mb="40px">
            <Text textStyle="bodyText3" fontWeight="400">
              {t('pumpOperators.title', { defaultValue: 'Pump Operators' })}
            </Text>
            <Text textStyle="bodyText3" fontWeight="400">
              {t('pumpOperators.totalLabel', { defaultValue: 'Total' })}: {pumpOperatorsTotal}
            </Text>
          </Flex>
          <PumpOperatorsChart
            data={data.pumpOperators}
            height="360px"
            note={t('pumpOperators.note', {
              defaultValue:
                'Note: Active pump operators submit readings at least 30 days in a month.',
            })}
          />
        </Box>
      </Grid>

      {/* Pump Operator Performance Table */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} w="full" minW={0}>
          <PumpOperatorsPerformanceTable
            title={t('pumpOperators.performanceTable.title', {
              defaultValue: 'Pump Operators Performance',
            })}
            data={operatorsPerformanceTable}
          />
        </Box>
        <Box
          display={{ base: 'none', lg: 'block' }}
          borderRadius="12px"
          borderWidth="0.5px"
          borderColor="transparent"
          bg="transparent"
        />
      </Grid>
    </>
  )
}
