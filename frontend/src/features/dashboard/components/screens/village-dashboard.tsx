import { useMemo, useState } from 'react'
import { Avatar, Box, Button, Flex, Grid, Icon, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu'
import type {
  DashboardData,
  EntityPerformance,
  VillagePumpOperatorDetails,
  WaterSupplyOutageData,
} from '../../types'
import {
  ImageSubmissionStatusChart,
  IssueTypeBreakdownChart,
  MetricPerformanceChart,
} from '../charts'
import { PhotoEvidenceComplianceTable } from '../tables'

type VillageDashboardScreenProps = {
  data: DashboardData
  villagePhotoEvidenceRows: DashboardData['photoEvidenceCompliance']
  waterSupplyOutagesData: WaterSupplyOutageData[]
  villagePumpOperatorDetails: VillagePumpOperatorDetails
  villagePumpOperators?: VillagePumpOperatorDetails[]
}

export function VillageDashboardScreen({
  data,
  villagePhotoEvidenceRows,
  waterSupplyOutagesData,
  villagePumpOperatorDetails,
  villagePumpOperators = [],
}: VillageDashboardScreenProps) {
  const { t } = useTranslation('dashboard')
  const [pumpOperatorPage, setPumpOperatorPage] = useState(1)
  const timeSeriesPerformanceData = useMemo<EntityPerformance[]>(
    () =>
      data.demandSupply.map((item, index) => ({
        id: `performance-${index}-${item.period}`,
        name: item.period,
        coverage: item.demand,
        regularity:
          item.demand > 0 ? Math.min(100, Math.round((item.supply / item.demand) * 100)) : 0,
        continuity: 0,
        quantity: item.supply,
        compositeScore: 0,
        status: 'needs-attention',
      })),
    [data.demandSupply]
  )
  const pumpOperatorPages = useMemo(
    () => (villagePumpOperators.length > 0 ? villagePumpOperators : [villagePumpOperatorDetails]),
    [villagePumpOperatorDetails, villagePumpOperators]
  )
  const totalPumpOperatorPages = pumpOperatorPages.length
  const activePumpOperatorPage = Math.min(pumpOperatorPage, totalPumpOperatorPages)
  const activePumpOperator =
    pumpOperatorPages[activePumpOperatorPage - 1] ?? villagePumpOperatorDetails
  const readingComplianceRows = useMemo(() => {
    const operatorRows = villagePhotoEvidenceRows.filter(
      (row) => row.name === activePumpOperator.name
    )
    if (operatorRows.length > 0) {
      return operatorRows
    }

    return [
      {
        id: `mock-${activePumpOperator.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: activePumpOperator.name,
        village: 'N/A',
        lastSubmission: activePumpOperator.lastSubmission,
        readingValue: 'N/A',
      },
    ]
  }, [activePumpOperator.lastSubmission, activePumpOperator.name, villagePhotoEvidenceRows])
  const visiblePageNumbers = useMemo(() => {
    if (totalPumpOperatorPages <= 3) {
      return Array.from({ length: totalPumpOperatorPages }, (_, index) => index + 1)
    }

    if (activePumpOperatorPage <= 2) {
      return [1, 2, 3]
    }

    if (activePumpOperatorPage >= totalPumpOperatorPages - 1) {
      return [totalPumpOperatorPages - 2, totalPumpOperatorPages - 1, totalPumpOperatorPages]
    }

    return [activePumpOperatorPage - 1, activePumpOperatorPage, activePumpOperatorPage + 1]
  }, [activePumpOperatorPage, totalPumpOperatorPages])

  return (
    <>
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6} mb={6}>
        <Box
          bg="white"
          borderWidth="0.5px"
          borderRadius="12px"
          borderColor="#E4E4E7"
          px="16px"
          pt="24px"
          pb="24px"
          h="523px"
          minW={0}
        >
          <Text textStyle="bodyText3" fontWeight="400" mb={2}>
            {t('performanceCharts.quantity.title', { defaultValue: 'Quantity Performance' })}
          </Text>
          <MetricPerformanceChart
            data={timeSeriesPerformanceData}
            metric="quantity"
            height="400px"
            entityLabel={t('performanceCharts.viewBy.time', { defaultValue: 'Time' })}
            yAxisLabel={t('performanceCharts.quantity.yAxisLabel', { defaultValue: 'Quantity' })}
            seriesName={t('performanceCharts.quantity.seriesName', { defaultValue: 'Quantity' })}
            showAreaLine
            areaSeriesName={t('performanceCharts.quantity.areaSeriesName', {
              defaultValue: 'Demand',
            })}
          />
        </Box>
        <Box
          bg="white"
          borderWidth="0.5px"
          borderRadius="12px"
          borderColor="#E4E4E7"
          px="16px"
          pt="24px"
          pb="24px"
          h="523px"
          minW={0}
        >
          <Text textStyle="bodyText3" fontWeight="400" mb={2}>
            {t('performanceCharts.regularity.title', { defaultValue: 'Regularity Performance' })}
          </Text>
          <MetricPerformanceChart
            data={timeSeriesPerformanceData}
            metric="regularity"
            height="400px"
            entityLabel={t('performanceCharts.viewBy.time', { defaultValue: 'Time' })}
            yAxisLabel={t('performanceCharts.regularity.yAxisLabel', {
              defaultValue: 'Regularity',
            })}
            seriesName={t('performanceCharts.regularity.seriesName', {
              defaultValue: 'Regularity',
            })}
          />
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
            {t('outageAndSubmissionCharts.titles.supplyOutageReasons', {
              defaultValue: 'Supply Outage Reasons',
            })}
          </Text>
          <IssueTypeBreakdownChart data={waterSupplyOutagesData} height="400px" />
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
            {t('outageAndSubmissionCharts.titles.readingSubmissionStatus', {
              defaultValue: 'Reading Submission Status',
            })}
          </Text>
          <ImageSubmissionStatusChart data={data.imageSubmissionStatus} height="406px" />
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
          minW={0}
        >
          <Flex direction="column" h="full">
            <Text textStyle="bodyText3" fontWeight="400" mb={4}>
              {t('pumpOperators.details.title', {
                defaultValue: 'Pump Operator Details',
              })}
            </Text>
            <Box>
              <Flex align="center" gap={3} mb={6}>
                <Avatar name={activePumpOperator.name} boxSize="44px" />
                <Text textStyle="bodyText4" fontSize="14px" fontWeight="500" color="neutral.950">
                  {activePumpOperator.name}
                </Text>
              </Flex>
              <Grid templateColumns="1fr auto" columnGap="24px" rowGap="12px" alignItems="center">
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.schemeNameSchemeId', {
                    defaultValue: 'Scheme name/ Scheme ID',
                  })}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.950" textAlign="right">
                  {activePumpOperator.scheme}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.stationLocation', {
                    defaultValue: 'Station location',
                  })}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.950" textAlign="right">
                  {activePumpOperator.stationLocation}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.lastSubmission', {
                    defaultValue: 'Last submission',
                  })}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.950" textAlign="right">
                  {activePumpOperator.lastSubmission}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.reportingRate', {
                    defaultValue: 'Reporting rate',
                  })}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.950" textAlign="right">
                  {activePumpOperator.reportingRate}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.missingSubmissionCount', {
                    defaultValue: 'Missing submission count',
                  })}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.950" textAlign="right">
                  {activePumpOperator.missingSubmissionCount}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.inactiveDays', {
                    defaultValue: 'Inactive days',
                  })}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.950" textAlign="right">
                  {activePumpOperator.inactiveDays}
                </Text>
              </Grid>
            </Box>
            {totalPumpOperatorPages > 1 ? (
              <Flex mt="auto" pt={6} align="center" justify="center" gap={2}>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Icon as={LuArrowLeft} boxSize={4} />}
                  onClick={() =>
                    setPumpOperatorPage((previousPage) =>
                      Math.max(1, Math.min(previousPage, totalPumpOperatorPages) - 1)
                    )
                  }
                  isDisabled={activePumpOperatorPage === 1}
                >
                  {t('pumpOperators.details.pagination.previous', {
                    defaultValue: 'Previous',
                  })}
                </Button>
                {visiblePageNumbers.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant="outline"
                    size="sm"
                    minW="34px"
                    px={0}
                    borderRadius="8px"
                    borderColor="#D4D4D8"
                    bg={activePumpOperatorPage === pageNumber ? '#3291D1' : 'white'}
                    color={activePumpOperatorPage === pageNumber ? 'white' : 'neutral.700'}
                    _hover={{
                      bg: activePumpOperatorPage === pageNumber ? '#3291D1' : 'neutral.100',
                    }}
                    onClick={() => setPumpOperatorPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<Icon as={LuArrowRight} boxSize={4} />}
                  onClick={() =>
                    setPumpOperatorPage((previousPage) =>
                      Math.min(
                        totalPumpOperatorPages,
                        Math.min(previousPage, totalPumpOperatorPages) + 1
                      )
                    )
                  }
                  isDisabled={activePumpOperatorPage === totalPumpOperatorPages}
                >
                  {t('pumpOperators.details.pagination.next', {
                    defaultValue: 'Next',
                  })}
                </Button>
              </Flex>
            ) : null}
          </Flex>
        </Box>
        <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="536px">
          <PhotoEvidenceComplianceTable
            data={readingComplianceRows}
            showVillageColumn={false}
            title={t('outageAndSubmissionCharts.titles.readingCompliance', {
              defaultValue: 'Reading Compliance',
            })}
          />
        </Box>
      </Grid>
    </>
  )
}
