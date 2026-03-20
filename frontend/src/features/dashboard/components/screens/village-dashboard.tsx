import { useMemo, useState } from 'react'
import { Avatar, Box, Button, Flex, Grid, Icon, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu'
import type {
  DashboardData,
  EntityPerformance,
  ReadingComplianceData,
  ReadingComplianceItem,
  VillagePumpOperatorDetails,
  WaterSupplyOutageData,
} from '../../types'
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

const getMissedSubmissionCount = (value?: number | string[] | null) => {
  if (Array.isArray(value)) {
    return value.length
  }

  return typeof value === 'number' ? value : null
}

const isSameOperator = (
  operator: {
    id?: number
    uuid?: string
    name?: string
  },
  fallback?: VillagePumpOperatorDetails
) => {
  if (!fallback) {
    return false
  }

  if (typeof operator.id === 'number' && typeof fallback.id === 'number') {
    return operator.id === fallback.id
  }

  if (operator.uuid && fallback.uuid) {
    return operator.uuid === fallback.uuid
  }

  return (
    Boolean(operator.name?.trim()) &&
    operator.name?.trim().toLowerCase() === fallback.name.trim().toLowerCase()
  )
}

const getOperatorMappingKey = (operator: {
  id?: number
  uuid?: string
  schemeId?: number
  name?: string
}) => {
  if (typeof operator.schemeId === 'number' && typeof operator.id === 'number') {
    return `${operator.schemeId}-${operator.id}`
  }

  if (typeof operator.schemeId === 'number' && operator.uuid) {
    return `${operator.schemeId}-${operator.uuid}`
  }

  if (typeof operator.id === 'number') {
    return String(operator.id)
  }

  if (operator.uuid) {
    return operator.uuid
  }

  return operator.name?.trim().toLowerCase().replace(/\s+/g, '-') || 'unknown-operator'
}

const mapReadingComplianceItemToVillageDetails = (
  item: ReadingComplianceItem,
  fallback?: VillagePumpOperatorDetails
): VillagePumpOperatorDetails => {
  const matchingFallback = isSameOperator(item, fallback) ? fallback : undefined
  const missingSubmissionCount =
    typeof item.missingSubmissionCount === 'number'
      ? item.missingSubmissionCount
      : getMissedSubmissionCount(item.missedSubmissionDays)

  return {
    id: item.id,
    uuid: item.uuid,
    mappingKey: getOperatorMappingKey(item),
    name: item.name?.trim() || matchingFallback?.name || 'N/A',
    email: item.email,
    phoneNumber: item.phoneNumber,
    status: item.status,
    schemeId: item.schemeId,
    schemeName: item.schemeName,
    scheme:
      item.schemeName && item.schemeId
        ? `${item.schemeName} / ${item.schemeId}`
        : matchingFallback?.scheme || 'N/A',
    stationLocation: matchingFallback?.stationLocation || 'N/A',
    lastSubmission:
      item.lastSubmissionAt != null
        ? formatReadingComplianceTimestamp(item.lastSubmissionAt)
        : matchingFallback?.lastSubmission || 'N/A',
    reportingRate:
      item.reportingRatePercent != null
        ? formatPercent(item.reportingRatePercent)
        : matchingFallback?.reportingRate || 'N/A',
    missingSubmissionCount:
      missingSubmissionCount != null
        ? formatCount(missingSubmissionCount)
        : matchingFallback?.missingSubmissionCount || 'N/A',
    inactiveDays:
      item.inactiveDays != null
        ? formatCount(item.inactiveDays)
        : matchingFallback?.inactiveDays || 'N/A',
  }
}

const getSubmissionTime = (item: ReadingComplianceItem) => {
  const value = item.lastSubmissionAt ?? item.readingAt ?? item.readingDate ?? null

  if (!value) {
    return 0
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime()
}

export function VillageDashboardScreen({
  data,
  waterSupplyOutagesData,
  villagePumpOperatorDetails,
  villagePumpOperators = [],
  tenantCode,
  schemeId,
}: VillageDashboardScreenProps) {
  const { t } = useTranslation('dashboard')
  const [pumpOperatorPage, setPumpOperatorPage] = useState(1)
  const effectiveSchemeId = schemeId ?? villagePumpOperatorDetails.schemeId

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
  const { data: readingComplianceApiData } = useReadingComplianceQuery({
    params:
      tenantCode && typeof effectiveSchemeId === 'number'
        ? {
            tenant_code: tenantCode,
            scheme_id: effectiveSchemeId,
            page: 0,
            size: 800,
          }
        : null,
    enabled: Boolean(tenantCode && typeof effectiveSchemeId === 'number'),
  })
  const fallbackPumpOperatorPages = useMemo(
    () => (villagePumpOperators.length > 0 ? villagePumpOperators : [villagePumpOperatorDetails]),
    [villagePumpOperatorDetails, villagePumpOperators]
  )
  const readingComplianceDataByOperator = useMemo(() => {
    const rowsByOperatorKey = new Map<string, ReadingComplianceItem[]>()
    const latestEntryByOperatorKey = new Map<string, ReadingComplianceItem>()

    for (const item of readingComplianceApiData?.data.content ?? []) {
      const operatorKey = getOperatorMappingKey(item)
      const rows = rowsByOperatorKey.get(operatorKey)

      if (rows) {
        rows.push(item)
      } else {
        rowsByOperatorKey.set(operatorKey, [item])
      }
    }

    rowsByOperatorKey.forEach((rows, operatorKey) => {
      rows.sort((left, right) => getSubmissionTime(right) - getSubmissionTime(left))
      const latestRow = rows[0]
      if (latestRow) {
        latestEntryByOperatorKey.set(operatorKey, latestRow)
      }
    })

    return {
      rowsByOperatorKey,
      latestEntryByOperatorKey,
    }
  }, [readingComplianceApiData?.data.content])
  const pumpOperatorPages = useMemo(() => {
    const apiPumpOperators = Array.from(
      readingComplianceDataByOperator.latestEntryByOperatorKey.values()
    ).map((item) => mapReadingComplianceItemToVillageDetails(item, villagePumpOperatorDetails))

    return apiPumpOperators.length > 0 ? apiPumpOperators : fallbackPumpOperatorPages
  }, [fallbackPumpOperatorPages, readingComplianceDataByOperator, villagePumpOperatorDetails])
  const totalPumpOperatorPages = Math.max(1, pumpOperatorPages.length)
  const activePumpOperatorPage = Math.min(pumpOperatorPage, totalPumpOperatorPages)
  const activePumpOperator =
    pumpOperatorPages[activePumpOperatorPage - 1] ?? villagePumpOperatorDetails
  const activePumpOperatorKey =
    activePumpOperator.mappingKey ?? getOperatorMappingKey(activePumpOperator)
  const readingComplianceRows = useMemo(() => {
    const selectedOperatorRows =
      readingComplianceDataByOperator.rowsByOperatorKey.get(activePumpOperatorKey) ?? []
    const apiRows: ReadingComplianceData[] = selectedOperatorRows.map((item, index) => ({
      id: [
        item.schemeId ?? effectiveSchemeId ?? 'scheme',
        item.id,
        item.readingAt ?? item.lastSubmissionAt ?? index,
      ].join('-'),
      name: item.name?.trim() || 'N/A',
      village: 'N/A',
      lastSubmission: formatReadingComplianceTimestamp(item.lastSubmissionAt),
      readingValue:
        item.confirmedReading === null || item.confirmedReading === undefined
          ? 'N/A'
          : String(item.confirmedReading),
    }))

    if (apiRows.length > 0) {
      return apiRows
    }

    return [
      {
        id: `operator-${
          activePumpOperatorKey ??
          (activePumpOperator.id ?? activePumpOperator.name)
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
        }`,
        name: activePumpOperator.name,
        village: 'N/A',
        lastSubmission: activePumpOperator.lastSubmission,
        readingValue: 'N/A',
      },
    ]
  }, [
    activePumpOperator,
    activePumpOperatorKey,
    effectiveSchemeId,
    readingComplianceDataByOperator,
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
          h={{ base: 'auto', md: '430px' }}
          minW={0}
          overflow="hidden"
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
              <Grid
                templateColumns={{ base: '1fr', sm: '1fr auto' }}
                columnGap="24px"
                rowGap="12px"
                alignItems="center"
              >
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.schemeNameSchemeId', {
                    defaultValue: 'Scheme name/ Scheme ID',
                  })}
                </Text>
                <Text
                  textStyle="bodyText4"
                  fontWeight="400"
                  color="neutral.950"
                  textAlign={{ base: 'left', sm: 'right' }}
                  wordBreak="break-word"
                >
                  {activePumpOperator.scheme}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.stationLocation', {
                    defaultValue: 'Station location',
                  })}
                </Text>
                <Text
                  textStyle="bodyText4"
                  fontWeight="400"
                  color="neutral.950"
                  textAlign={{ base: 'left', sm: 'right' }}
                  wordBreak="break-word"
                >
                  {activePumpOperator.stationLocation}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.lastSubmission', {
                    defaultValue: 'Last submission',
                  })}
                </Text>
                <Text
                  textStyle="bodyText4"
                  fontWeight="400"
                  color="neutral.950"
                  textAlign={{ base: 'left', sm: 'right' }}
                >
                  {activePumpOperator.lastSubmission}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.reportingRate', {
                    defaultValue: 'Reporting rate',
                  })}
                </Text>
                <Text
                  textStyle="bodyText4"
                  fontWeight="400"
                  color="neutral.950"
                  textAlign={{ base: 'left', sm: 'right' }}
                >
                  {activePumpOperator.reportingRate}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.missingSubmissionCount', {
                    defaultValue: 'Missing submission count',
                  })}
                </Text>
                <Text
                  textStyle="bodyText4"
                  fontWeight="400"
                  color="neutral.950"
                  textAlign={{ base: 'left', sm: 'right' }}
                >
                  {activePumpOperator.missingSubmissionCount}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.inactiveDays', {
                    defaultValue: 'Inactive days',
                  })}
                </Text>
                <Text
                  textStyle="bodyText4"
                  fontWeight="400"
                  color="neutral.950"
                  textAlign={{ base: 'left', sm: 'right' }}
                >
                  {activePumpOperator.inactiveDays}
                </Text>
              </Grid>
            </Box>
            {totalPumpOperatorPages > 1 ? (
              <Flex
                mt={{ base: 4, md: 'auto' }}
                pt={{ base: 4, md: 6 }}
                align="center"
                justify="center"
                gap={{ base: 1.5, sm: 2 }}
                wrap="wrap"
                w="full"
                maxW="100%"
              >
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
                  px={{ base: 2, sm: 3 }}
                  minW={0}
                  aria-label={t('pumpOperators.details.pagination.previous', {
                    defaultValue: 'Previous',
                  })}
                >
                  <Text as="span" display={{ base: 'none', sm: 'inline' }}>
                    {t('pumpOperators.details.pagination.previous', {
                      defaultValue: 'Previous',
                    })}
                  </Text>
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
                    flexShrink={0}
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
                  px={{ base: 2, sm: 3 }}
                  minW={0}
                  aria-label={t('pumpOperators.details.pagination.next', {
                    defaultValue: 'Next',
                  })}
                >
                  <Text as="span" display={{ base: 'none', sm: 'inline' }}>
                    {t('pumpOperators.details.pagination.next', {
                      defaultValue: 'Next',
                    })}
                  </Text>
                </Button>
              </Flex>
            ) : null}
          </Flex>
        </Box>
        <Box bg="white" borderWidth="1px" borderRadius="lg" px={4} py={6} h="430px" minW={0}>
          <ReadingComplianceTable
            key={activePumpOperatorKey}
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
