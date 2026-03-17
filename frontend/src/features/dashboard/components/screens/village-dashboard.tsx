import { useMemo, useState } from 'react'
import { Avatar, Box, Button, Flex, Grid, Icon, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu'
import type {
  DashboardData,
  EntityPerformance,
  PumpOperatorDetailsResponse,
  ReadingComplianceData,
  VillagePumpOperatorDetails,
  WaterSupplyOutageData,
} from '../../types'
import { usePumpOperatorDetailsQuery } from '../../services/query/use-pump-operator-details-query'
import { usePumpOperatorsBySchemeQuery } from '../../services/query/use-pump-operators-by-scheme-query'
import { useReadingComplianceQuery } from '../../services/query/use-reading-compliance-query'
import { SupplyOutageReasonsChart, MetricPerformanceChart } from '../charts'
import { ReadingComplianceTable } from '../tables'
import { ReadingSubmissionStatusCard } from './reading-submission-status-card'

type VillageDashboardScreenProps = {
  data: DashboardData
  villagePhotoEvidenceRows: DashboardData['readingCompliance']
  waterSupplyOutagesData: WaterSupplyOutageData[]
  villagePumpOperatorDetails: VillagePumpOperatorDetails
  villagePumpOperators?: VillagePumpOperatorDetails[]
  tenantCode?: string
  schemeId?: number
}

const formatReadingComplianceTimestamp = (value?: string | null) => {
  if (!value) {
    return 'N/A'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  const datePart = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(parsedDate)
  const timeParts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(parsedDate)
  const hour = timeParts.find((part) => part.type === 'hour')?.value ?? ''
  const minute = timeParts.find((part) => part.type === 'minute')?.value ?? ''
  const dayPeriod = timeParts.find((part) => part.type === 'dayPeriod')?.value.toLowerCase() ?? ''

  return `${datePart.replace(/\//g, '-')}, ${hour}:${minute}${dayPeriod}`
}

const formatPercent = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  return `${value}%`
}

const formatCount = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  return String(value)
}

const formatStationLocation = (
  latitude?: number | null,
  longitude?: number | null,
  fallback = 'N/A'
) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return fallback
  }

  return `${latitude}, ${longitude}`
}

const mapOperatorSummaryToVillageDetails = (
  operator: {
    id: number
    uuid: string
    name: string
    email: string
    phoneNumber: string
    status: number
    schemeId: number
    schemeName: string
  },
  fallback?: VillagePumpOperatorDetails
): VillagePumpOperatorDetails => ({
  id: operator.id,
  uuid: operator.uuid,
  name: operator.name?.trim() || fallback?.name || 'N/A',
  email: operator.email,
  phoneNumber: operator.phoneNumber,
  status: operator.status,
  schemeId: operator.schemeId,
  schemeName: operator.schemeName,
  scheme:
    operator.schemeName && operator.schemeId
      ? `${operator.schemeName} / ${operator.schemeId}`
      : fallback?.scheme || 'N/A',
  stationLocation: fallback?.stationLocation || 'N/A',
  lastSubmission: fallback?.lastSubmission || 'N/A',
  reportingRate: fallback?.reportingRate || 'N/A',
  missingSubmissionCount: fallback?.missingSubmissionCount || 'N/A',
  inactiveDays: fallback?.inactiveDays || 'N/A',
})

const mergeOperatorDetails = (
  summary: VillagePumpOperatorDetails,
  detail?: PumpOperatorDetailsResponse['data']
): VillagePumpOperatorDetails => {
  if (!detail) {
    return summary
  }

  return {
    ...summary,
    ...detail,
    scheme:
      detail.schemeName && detail.schemeId
        ? `${detail.schemeName} / ${detail.schemeId}`
        : summary.scheme,
    stationLocation: formatStationLocation(
      detail.schemeLatitude,
      detail.schemeLongitude,
      summary.stationLocation
    ),
    lastSubmission:
      formatReadingComplianceTimestamp(detail.lastSubmissionAt) || summary.lastSubmission,
    reportingRate: formatPercent(detail.reportingRatePercent),
    missingSubmissionCount: formatCount(detail.missedSubmissionDays),
    inactiveDays: formatCount(detail.missedSubmissionDays),
  }
}

export function VillageDashboardScreen({
  data,
  villagePhotoEvidenceRows,
  waterSupplyOutagesData,
  villagePumpOperatorDetails,
  villagePumpOperators = [],
  tenantCode,
  schemeId,
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
  const { data: pumpOperatorsBySchemeData } = usePumpOperatorsBySchemeQuery({
    params:
      tenantCode && typeof schemeId === 'number'
        ? {
            tenant_code: tenantCode,
            scheme_id: schemeId,
          }
        : null,
    enabled: Boolean(tenantCode && typeof schemeId === 'number'),
  })
  const fallbackPumpOperatorPages = useMemo(
    () => (villagePumpOperators.length > 0 ? villagePumpOperators : [villagePumpOperatorDetails]),
    [villagePumpOperatorDetails, villagePumpOperators]
  )
  const pumpOperatorPages = useMemo(() => {
    const apiPumpOperators =
      pumpOperatorsBySchemeData?.data.flatMap((schemeItem) =>
        schemeItem.pumpOperators.map((operator) =>
          mapOperatorSummaryToVillageDetails(
            {
              ...operator,
              schemeId: schemeItem.schemeId,
              schemeName: schemeItem.schemeName,
            },
            villagePumpOperatorDetails
          )
        )
      ) ?? []

    return apiPumpOperators.length > 0 ? apiPumpOperators : fallbackPumpOperatorPages
  }, [fallbackPumpOperatorPages, pumpOperatorsBySchemeData?.data, villagePumpOperatorDetails])
  const totalPumpOperatorPages = Math.max(1, pumpOperatorPages.length)
  const activePumpOperatorPage = Math.min(pumpOperatorPage, totalPumpOperatorPages)
  const activePumpOperatorSummary =
    pumpOperatorPages[activePumpOperatorPage - 1] ?? villagePumpOperatorDetails
  const { data: activePumpOperatorDetailsData } = usePumpOperatorDetailsQuery({
    params:
      activePumpOperatorSummary.id && tenantCode
        ? {
            pumpOperatorId: activePumpOperatorSummary.id,
            tenant_code: tenantCode,
          }
        : null,
    enabled: Boolean(activePumpOperatorSummary.id && tenantCode),
  })
  const activePumpOperator = useMemo(
    () => mergeOperatorDetails(activePumpOperatorSummary, activePumpOperatorDetailsData?.data),
    [activePumpOperatorDetailsData?.data, activePumpOperatorSummary]
  )
  const { data: readingComplianceApiData } = useReadingComplianceQuery({
    params: tenantCode
      ? {
          tenant_code: tenantCode,
        }
      : null,
    enabled: Boolean(tenantCode),
  })
  const readingComplianceRows = useMemo(() => {
    const apiRows: ReadingComplianceData[] =
      readingComplianceApiData?.data.map((item) => ({
        id: String(item.id),
        name: item.name?.trim() || 'N/A',
        village: 'N/A',
        lastSubmission: formatReadingComplianceTimestamp(item.lastSubmissionAt),
        readingValue:
          item.confirmedReading === null || item.confirmedReading === undefined
            ? 'N/A'
            : String(item.confirmedReading),
      })) ?? []

    const sourceRows = apiRows.length > 0 ? apiRows : villagePhotoEvidenceRows
    const operatorRows = sourceRows.filter((row) => row.name === activePumpOperator.name)
    if (operatorRows.length > 0) {
      return operatorRows
    }

    if (sourceRows.length > 0) {
      return sourceRows
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
  }, [
    activePumpOperator.lastSubmission,
    activePumpOperator.name,
    readingComplianceApiData?.data,
    villagePhotoEvidenceRows,
  ])
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
          <Text textStyle="bodyText3" fontWeight="400" mb="40px">
            {t('outageAndSubmissionCharts.titles.supplyOutageReasons', {
              defaultValue: 'Supply Outage Reasons',
            })}
          </Text>
          <SupplyOutageReasonsChart data={waterSupplyOutagesData} height="400px" />
        </Box>
        <ReadingSubmissionStatusCard
          data={data.readingSubmissionStatus}
          chartHeight="406px"
          cardHeight="523px"
          boxProps={{ w: 'full' }}
        />
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
          h="430px"
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
        <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="430px" minW={0}>
          <ReadingComplianceTable
            data={readingComplianceRows}
            showVillageColumn={false}
            scrollAreaMaxH="320px"
            title={t('outageAndSubmissionCharts.titles.readingCompliance', {
              defaultValue: 'Reading Compliance',
            })}
          />
        </Box>
      </Grid>
    </>
  )
}
