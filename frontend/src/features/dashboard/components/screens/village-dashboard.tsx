import { useEffect, useMemo, useState } from 'react'
import { Avatar, Box, Button, Flex, Grid, Icon, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu'
import { ChartEmptyState, LoadingSpinner } from '@/shared/components/common'
import type { MonthlyTrendPoint } from '../charts/monthly-trend-chart'
import type {
  DashboardData,
  PumpOperatorsBySchemeItem,
  ReadingComplianceData,
  ReadingComplianceItem,
  VillagePumpOperatorDetails,
  WaterSupplyOutageData,
} from '../../types'
import { usePumpOperatorDetailsQuery } from '../../services/query/use-pump-operator-details-query'
import { usePumpOperatorsBySchemeQuery } from '../../services/query/use-pump-operators-by-scheme-query'
import { useReadingComplianceQuery } from '../../services/query/use-reading-compliance-query'
import { MonthlyTrendChart, SupplyOutageReasonsChart } from '../charts'
import { ReadingComplianceTable } from '../tables'
import { ReadingSubmissionStatusCard } from './reading-submission-status-card'
import { toCapitalizedWords } from '../../utils/format-location-label'

type VillageDashboardScreenProps = {
  data: DashboardData
  villagePhotoEvidenceRows: DashboardData['readingCompliance']
  waterSupplyOutagesData: WaterSupplyOutageData[]
  villagePumpOperatorDetails: VillagePumpOperatorDetails
  villagePumpOperators?: VillagePumpOperatorDetails[]
  tenantCode?: string
  schemeId?: number
  quantityTimeTrendData?: MonthlyTrendPoint[]
  regularityTimeTrendData?: MonthlyTrendPoint[]
  isQuantityTimeTrendLoading?: boolean
  isRegularityTimeTrendLoading?: boolean
}

const READING_COMPLIANCE_PAGE_SIZE = 50

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

const getReadingComplianceTimestampValue = (item: {
  lastSubmissionAt?: string | null
  readingAt?: string | null
  readingDate?: string | null
}) => item.lastSubmissionAt ?? item.readingAt ?? item.readingDate ?? null

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
    schemeId?: number
    name?: string
  },
  fallback?: VillagePumpOperatorDetails
) => {
  if (!fallback) {
    return false
  }

  if (typeof operator.schemeId !== 'number' || typeof fallback.schemeId !== 'number') {
    return false
  }

  if (operator.schemeId !== fallback.schemeId) {
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

const normalizeSchemeLabel = (value?: string | null) => {
  const trimmedValue = value?.trim()
  return trimmedValue ? toCapitalizedWords(trimmedValue) : undefined
}

const formatStationLocation = (
  latitude?: number | null,
  longitude?: number | null,
  fallback?: string
) => {
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return `${latitude}, ${longitude}`
  }

  return fallback || 'N/A'
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
  const normalizedSchemeName = normalizeSchemeLabel(item.schemeName)

  return {
    id: item.id,
    uuid: item.uuid,
    mappingKey: getOperatorMappingKey(item),
    name: item.name?.trim() || matchingFallback?.name || 'N/A',
    email: item.email,
    phoneNumber: item.phoneNumber,
    status: item.status,
    schemeId: item.schemeId,
    schemeName: normalizedSchemeName,
    scheme:
      normalizedSchemeName && item.schemeId
        ? `${normalizedSchemeName} / ${item.schemeId}`
        : matchingFallback?.scheme || 'N/A',
    stationLocation: matchingFallback?.stationLocation || 'N/A',
    lastSubmission:
      getReadingComplianceTimestampValue(item) != null
        ? formatReadingComplianceTimestamp(getReadingComplianceTimestampValue(item))
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

const mapPumpOperatorSummaryToVillageDetails = (
  item: PumpOperatorsBySchemeItem['pumpOperators'][number],
  schemeId: number,
  schemeName?: string,
  fallback?: VillagePumpOperatorDetails
): VillagePumpOperatorDetails => {
  const normalizedSchemeName = normalizeSchemeLabel(schemeName)

  return {
    id: item.id,
    uuid: item.uuid,
    mappingKey: getOperatorMappingKey({
      id: item.id,
      uuid: item.uuid,
      schemeId,
      name: item.name,
    }),
    name: item.name?.trim() || fallback?.name || 'N/A',
    email: item.email,
    phoneNumber: item.phoneNumber,
    status: item.status,
    schemeId,
    schemeName: normalizedSchemeName,
    scheme:
      normalizedSchemeName && schemeId
        ? `${normalizedSchemeName} / ${schemeId}`
        : fallback?.scheme || 'N/A',
    stationLocation: fallback?.stationLocation || 'N/A',
    lastSubmission: fallback?.lastSubmission || 'N/A',
    reportingRate: fallback?.reportingRate || 'N/A',
    missingSubmissionCount: fallback?.missingSubmissionCount || 'N/A',
    inactiveDays: fallback?.inactiveDays || 'N/A',
  }
}

const mapPumpOperatorDetailsToVillageDetails = (
  item: {
    id: number
    uuid: string
    name: string
    email: string
    phoneNumber: string
    status: number
    schemeId: number
    schemeName: string
    schemeLatitude: number | null
    schemeLongitude: number | null
    lastSubmissionAt: string | null
    firstSubmissionDate: string | null
    totalDaysSinceFirstSubmission: number | null
    submittedDays: number
    reportingRatePercent: number | null
    missedSubmissionDays: number | null
    inactiveDays?: number | null
  },
  fallback?: VillagePumpOperatorDetails
): VillagePumpOperatorDetails => {
  const normalizedSchemeName = normalizeSchemeLabel(item.schemeName)
  const missedSubmissionCount = getMissedSubmissionCount(item.missedSubmissionDays)

  return {
    id: item.id,
    uuid: item.uuid,
    mappingKey: getOperatorMappingKey(item),
    name: item.name?.trim() || fallback?.name || 'N/A',
    email: item.email,
    phoneNumber: item.phoneNumber,
    status: item.status,
    schemeId: item.schemeId,
    schemeName: normalizedSchemeName,
    scheme:
      normalizedSchemeName && item.schemeId
        ? `${normalizedSchemeName} / ${item.schemeId}`
        : fallback?.scheme || 'N/A',
    schemeLatitude: item.schemeLatitude,
    schemeLongitude: item.schemeLongitude,
    lastSubmissionAt: item.lastSubmissionAt,
    firstSubmissionDate: item.firstSubmissionDate,
    totalDaysSinceFirstSubmission: item.totalDaysSinceFirstSubmission,
    submittedDays: item.submittedDays,
    reportingRatePercent: item.reportingRatePercent,
    missedSubmissionDays: missedSubmissionCount,
    stationLocation: formatStationLocation(
      item.schemeLatitude,
      item.schemeLongitude,
      fallback?.stationLocation
    ),
    lastSubmission:
      item.lastSubmissionAt != null
        ? formatReadingComplianceTimestamp(item.lastSubmissionAt)
        : fallback?.lastSubmission || 'N/A',
    reportingRate:
      item.reportingRatePercent != null
        ? formatPercent(item.reportingRatePercent)
        : fallback?.reportingRate || 'N/A',
    missingSubmissionCount:
      missedSubmissionCount != null
        ? formatCount(missedSubmissionCount)
        : fallback?.missingSubmissionCount || 'N/A',
    inactiveDays:
      item.inactiveDays != null ? formatCount(item.inactiveDays) : fallback?.inactiveDays || 'N/A',
  }
}

const getSubmissionTime = (item: ReadingComplianceItem) => {
  const value = getReadingComplianceTimestampValue(item)

  if (!value) {
    return 0
  }

  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime()
}

const getReadingComplianceItemKey = (
  item: ReadingComplianceItem,
  index: number,
  pageIndex?: number
) =>
  [
    item.schemeId ?? 'scheme',
    item.id,
    item.readingAt ?? item.lastSubmissionAt ?? 'no-timestamp',
    item.confirmedReading ?? 'no-reading',
    pageIndex ?? index,
  ].join('-')

const isMissingDisplayValue = (value?: string | null) => {
  const normalized = value?.trim().toLowerCase()
  return !normalized || normalized === 'n/a'
}

type ReadingComplianceSectionProps = {
  villagePumpOperatorDetails: VillagePumpOperatorDetails
  villagePumpOperators: VillagePumpOperatorDetails[]
  tenantCode?: string
  effectiveSchemeId?: number
}

function ReadingComplianceSection({
  villagePumpOperatorDetails,
  villagePumpOperators,
  tenantCode,
  effectiveSchemeId,
}: ReadingComplianceSectionProps) {
  const { t } = useTranslation('dashboard')
  const [pumpOperatorPage, setPumpOperatorPage] = useState(1)
  const [readingCompliancePage, setReadingCompliancePage] = useState(0)
  const [loadedReadingCompliancePages, setLoadedReadingCompliancePages] = useState<
    Record<number, ReadingComplianceItem[]>
  >({})
  const readingComplianceParams = useMemo(
    () =>
      tenantCode
        ? {
            tenant_code: tenantCode,
            scheme_id: typeof effectiveSchemeId === 'number' ? effectiveSchemeId : undefined,
            page: readingCompliancePage,
            size: READING_COMPLIANCE_PAGE_SIZE,
          }
        : null,
    [effectiveSchemeId, readingCompliancePage, tenantCode]
  )
  const pumpOperatorsBySchemeParams = useMemo(
    () =>
      tenantCode && typeof effectiveSchemeId === 'number'
        ? {
            tenant_code: tenantCode,
            scheme_id: effectiveSchemeId,
          }
        : null,
    [effectiveSchemeId, tenantCode]
  )
  const { data: pumpOperatorsBySchemeData } = usePumpOperatorsBySchemeQuery({
    params: pumpOperatorsBySchemeParams,
    enabled: Boolean(pumpOperatorsBySchemeParams),
  })
  const { data: readingComplianceApiData, isFetching: isReadingComplianceFetching } =
    useReadingComplianceQuery({
      params: readingComplianceParams,
      enabled: Boolean(readingComplianceParams),
    })
  const currentPageItems = useMemo(
    () => readingComplianceApiData?.data.content ?? [],
    [readingComplianceApiData?.data.content]
  )
  const currentResponsePage = readingComplianceApiData?.data.number ?? readingCompliancePage
  const currentPageSignature = useMemo(
    () =>
      currentPageItems
        .map((item, index) => getReadingComplianceItemKey(item, index, currentResponsePage))
        .join('|'),
    [currentPageItems, currentResponsePage]
  )

  useEffect(() => {
    // This effect intentionally snapshots fetched pages into local state so
    // older history remains available while newer pages are loaded.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadedReadingCompliancePages((currentPages) => {
      const existingPageItems = currentPages[currentResponsePage] ?? []
      const existingPageSignature = existingPageItems
        .map((item, index) => getReadingComplianceItemKey(item, index, currentResponsePage))
        .join('|')

      if (existingPageSignature === currentPageSignature) {
        return currentPages
      }

      return {
        ...currentPages,
        [currentResponsePage]: currentPageItems,
      }
    })
  }, [currentPageItems, currentPageSignature, currentResponsePage])

  const readingComplianceItems = useMemo(() => {
    if (!readingComplianceParams) {
      return []
    }

    const mergedItems: ReadingComplianceItem[] = []
    const existingKeys = new Set<string>()

    const loadedPageNumbers = Object.keys(loadedReadingCompliancePages)
      .map((pageNumber) => Number(pageNumber))
      .filter((pageNumber) => Number.isFinite(pageNumber))
      .sort((left, right) => left - right)

    for (const pageIndex of loadedPageNumbers) {
      const pageItems = loadedReadingCompliancePages[pageIndex] ?? []

      pageItems.forEach((item, index) => {
        const itemKey = getReadingComplianceItemKey(item, index, pageIndex)

        if (!existingKeys.has(itemKey)) {
          existingKeys.add(itemKey)
          mergedItems.push(item)
        }
      })
    }

    return mergedItems
  }, [loadedReadingCompliancePages, readingComplianceParams])
  const totalPages = readingComplianceApiData?.data.totalPages
  const hasMoreReadingCompliancePages =
    typeof totalPages === 'number'
      ? currentResponsePage + 1 < totalPages
      : currentPageItems.length === READING_COMPLIANCE_PAGE_SIZE
  const fallbackPumpOperatorPages = useMemo(
    () => (villagePumpOperators.length > 0 ? villagePumpOperators : [villagePumpOperatorDetails]),
    [villagePumpOperatorDetails, villagePumpOperators]
  )
  const pumpOperatorApiPages = useMemo(() => {
    const schemeGroups = pumpOperatorsBySchemeData?.data ?? []
    const matchingSchemeGroup =
      schemeGroups.find((group) => group.schemeId === effectiveSchemeId) ?? schemeGroups[0]

    if (!matchingSchemeGroup) {
      return []
    }

    return matchingSchemeGroup.pumpOperators.map((operator) =>
      mapPumpOperatorSummaryToVillageDetails(
        operator,
        matchingSchemeGroup.schemeId,
        matchingSchemeGroup.schemeName,
        fallbackPumpOperatorPages.find((fallbackOperator) =>
          isSameOperator(operator, fallbackOperator)
        )
      )
    )
  }, [effectiveSchemeId, fallbackPumpOperatorPages, pumpOperatorsBySchemeData?.data])
  const readingComplianceDataByOperator = useMemo(() => {
    const rowsByOperatorKey = new Map<string, ReadingComplianceItem[]>()
    const latestEntryByOperatorKey = new Map<string, ReadingComplianceItem>()

    for (const item of readingComplianceItems) {
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
  }, [readingComplianceItems])
  const pumpOperatorPages = useMemo(() => {
    if (pumpOperatorApiPages.length > 0) {
      return pumpOperatorApiPages
    }

    const complianceDerivedOperators = Array.from(
      readingComplianceDataByOperator.latestEntryByOperatorKey.values()
    ).map((item) => mapReadingComplianceItemToVillageDetails(item, villagePumpOperatorDetails))

    return complianceDerivedOperators.length > 0
      ? complianceDerivedOperators
      : fallbackPumpOperatorPages
  }, [
    fallbackPumpOperatorPages,
    pumpOperatorApiPages,
    readingComplianceDataByOperator,
    villagePumpOperatorDetails,
  ])
  const totalPumpOperatorPages = Math.max(1, pumpOperatorPages.length)
  const activePumpOperatorPage = Math.min(pumpOperatorPage, totalPumpOperatorPages)
  const activePumpOperator =
    pumpOperatorPages[activePumpOperatorPage - 1] ?? villagePumpOperatorDetails
  const activePumpOperatorKey =
    activePumpOperator.mappingKey ?? getOperatorMappingKey(activePumpOperator)
  const activePumpOperatorId = activePumpOperator.id
  const activePumpOperatorDetailsParams = useMemo(
    () =>
      tenantCode && typeof activePumpOperatorId === 'number'
        ? {
            tenant_code: tenantCode,
            pumpOperatorId: activePumpOperatorId,
          }
        : null,
    [activePumpOperatorId, tenantCode]
  )
  const { data: pumpOperatorDetailsApiData } = usePumpOperatorDetailsQuery({
    params: activePumpOperatorDetailsParams,
    enabled: Boolean(activePumpOperatorDetailsParams),
  })
  const resolvedActivePumpOperator = useMemo(() => {
    const detailsPayload = pumpOperatorDetailsApiData?.data

    if (detailsPayload) {
      return mapPumpOperatorDetailsToVillageDetails(detailsPayload, activePumpOperator)
    }

    const latestComplianceItem =
      readingComplianceDataByOperator.latestEntryByOperatorKey.get(activePumpOperatorKey)

    if (latestComplianceItem) {
      return mapReadingComplianceItemToVillageDetails(latestComplianceItem, activePumpOperator)
    }

    return activePumpOperator
  }, [
    activePumpOperator,
    activePumpOperatorKey,
    pumpOperatorDetailsApiData?.data,
    readingComplianceDataByOperator.latestEntryByOperatorKey,
  ])
  const selectedOperatorHistoryCount =
    readingComplianceDataByOperator.rowsByOperatorKey.get(activePumpOperatorKey)?.length ?? 0
  const currentPageIncludesActiveOperator = useMemo(
    () => currentPageItems.some((item) => getOperatorMappingKey(item) === activePumpOperatorKey),
    [activePumpOperatorKey, currentPageItems]
  )
  const currentPageActiveOperatorCount = useMemo(
    () =>
      currentPageItems.reduce(
        (count, item) => count + (getOperatorMappingKey(item) === activePumpOperatorKey ? 1 : 0),
        0
      ),
    [activePumpOperatorKey, currentPageItems]
  )
  const readingComplianceRows = useMemo(() => {
    const selectedOperatorRows =
      readingComplianceDataByOperator.rowsByOperatorKey.get(activePumpOperatorKey) ?? []
    const apiRows: ReadingComplianceData[] = selectedOperatorRows.map((item, index) => ({
      id: [
        item.schemeId ?? effectiveSchemeId ?? 'scheme',
        item.id,
        item.readingAt ?? item.lastSubmissionAt ?? 'no-timestamp',
        item.confirmedReading ?? 'no-reading',
        index,
      ].join('-'),
      name: item.name?.trim() || 'N/A',
      village: 'N/A',
      lastSubmission: formatReadingComplianceTimestamp(getReadingComplianceTimestampValue(item)),
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
          (resolvedActivePumpOperator.id ?? resolvedActivePumpOperator.name)
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')
        }`,
        name: resolvedActivePumpOperator.name,
        village: 'N/A',
        lastSubmission: resolvedActivePumpOperator.lastSubmission,
        readingValue: 'N/A',
      },
    ]
  }, [
    activePumpOperatorKey,
    effectiveSchemeId,
    readingComplianceDataByOperator,
    resolvedActivePumpOperator,
  ])
  const isPumpOperatorDetailsEmpty = useMemo(
    () =>
      [
        resolvedActivePumpOperator.name,
        resolvedActivePumpOperator.scheme,
        resolvedActivePumpOperator.stationLocation,
        resolvedActivePumpOperator.lastSubmission,
        resolvedActivePumpOperator.reportingRate,
        resolvedActivePumpOperator.missingSubmissionCount,
        resolvedActivePumpOperator.inactiveDays,
      ].every((value) => isMissingDisplayValue(value)),
    [resolvedActivePumpOperator]
  )
  const hasMeaningfulReadingComplianceRows = useMemo(
    () =>
      readingComplianceRows.some(
        (row) =>
          !isMissingDisplayValue(row.name) ||
          !isMissingDisplayValue(row.village) ||
          !isMissingDisplayValue(row.lastSubmission) ||
          !isMissingDisplayValue(row.readingValue)
      ),
    [readingComplianceRows]
  )

  useEffect(() => {
    if (!readingComplianceParams || isReadingComplianceFetching || !hasMoreReadingCompliancePages) {
      return
    }

    if (
      currentPageItems.length === 0 ||
      selectedOperatorHistoryCount > 1 ||
      currentPageActiveOperatorCount >= 2 ||
      !currentPageIncludesActiveOperator
    ) {
      return
    }

    // This effect intentionally advances through contiguous history pages for
    // the selected operator until an older submission is found.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReadingCompliancePage((currentPage) => currentPage + 1)
  }, [
    currentPageActiveOperatorCount,
    currentPageIncludesActiveOperator,
    currentPageItems.length,
    hasMoreReadingCompliancePages,
    isReadingComplianceFetching,
    readingComplianceParams,
    selectedOperatorHistoryCount,
  ])

  const handleReachReadingComplianceEnd = () => {
    if (!hasMoreReadingCompliancePages || isReadingComplianceFetching) {
      return
    }

    if ((readingComplianceApiData?.data.content ?? []).length === 0) {
      return
    }

    setReadingCompliancePage((currentPage) => currentPage + 1)
  }
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
          {isPumpOperatorDetailsEmpty ? (
            <ChartEmptyState minHeight="100%" />
          ) : (
            <Box>
              <Flex align="center" gap={3} mb={6}>
                <Avatar name={resolvedActivePumpOperator.name} boxSize="44px" />
                <Text textStyle="bodyText4" fontSize="14px" fontWeight="500" color="neutral.950">
                  {resolvedActivePumpOperator.name}
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
                  {resolvedActivePumpOperator.scheme}
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
                  {resolvedActivePumpOperator.stationLocation}
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
                  {resolvedActivePumpOperator.lastSubmission}
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
                  {resolvedActivePumpOperator.reportingRate}
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
                  {resolvedActivePumpOperator.missingSubmissionCount}
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
                  {resolvedActivePumpOperator.inactiveDays}
                </Text>
              </Grid>
            </Box>
          )}
          {!isPumpOperatorDetailsEmpty && totalPumpOperatorPages > 1 ? (
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
          data={hasMeaningfulReadingComplianceRows ? readingComplianceRows : []}
          showVillageColumn={false}
          scrollAreaMaxH="320px"
          onReachEnd={
            hasMeaningfulReadingComplianceRows ? handleReachReadingComplianceEnd : undefined
          }
          title={t('outageAndSubmissionCharts.titles.readingCompliance', {
            defaultValue: 'Reading Compliance',
          })}
        />
      </Box>
    </Grid>
  )
}

export function VillageDashboardScreen({
  data,
  waterSupplyOutagesData,
  villagePumpOperatorDetails,
  villagePumpOperators = [],
  tenantCode,
  schemeId,
  quantityTimeTrendData = [],
  regularityTimeTrendData = [],
  isQuantityTimeTrendLoading = false,
  isRegularityTimeTrendLoading = false,
}: VillageDashboardScreenProps) {
  const { t } = useTranslation('dashboard')
  const effectiveSchemeId = schemeId ?? villagePumpOperatorDetails.schemeId

  const readingComplianceScopeKey = `${tenantCode ?? 'no-tenant'}:${effectiveSchemeId ?? 'no-scheme'}`

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
          h="492px"
          minW={0}
        >
          <Text textStyle="bodyText3" fontWeight="400" mb={2}>
            {t('performanceCharts.quantity.title', { defaultValue: 'Quantity Performance' })}
          </Text>
          {isQuantityTimeTrendLoading ? (
            <Flex align="center" justify="center" h="400px">
              <LoadingSpinner />
            </Flex>
          ) : quantityTimeTrendData.length > 0 ? (
            <MonthlyTrendChart
              data={quantityTimeTrendData}
              height="400px"
              xAxisLabel={t('performanceCharts.viewBy.time', { defaultValue: 'Time' })}
              yAxisLabel={t('performanceCharts.quantity.yAxisLabel', { defaultValue: 'Quantity' })}
              seriesName={t('performanceCharts.quantity.seriesName', { defaultValue: 'Quantity' })}
            />
          ) : (
            <ChartEmptyState minHeight="400px" />
          )}
        </Box>
        <Box
          bg="white"
          borderWidth="0.5px"
          borderRadius="12px"
          borderColor="#E4E4E7"
          px="16px"
          pt="24px"
          pb="24px"
          h="492px"
          minW={0}
        >
          <Text textStyle="bodyText3" fontWeight="400" mb={2}>
            {t('performanceCharts.regularity.title', { defaultValue: 'Regularity Performance' })}
          </Text>
          {isRegularityTimeTrendLoading ? (
            <Flex align="center" justify="center" h="400px">
              <LoadingSpinner />
            </Flex>
          ) : regularityTimeTrendData.length > 0 ? (
            <MonthlyTrendChart
              data={regularityTimeTrendData}
              height="400px"
              isPercent
              xAxisLabel={t('performanceCharts.viewBy.time', { defaultValue: 'Time' })}
              yAxisLabel={t('performanceCharts.regularity.yAxisLabel', {
                defaultValue: 'Regularity',
              })}
              seriesName={t('performanceCharts.regularity.seriesName', {
                defaultValue: 'Regularity',
              })}
            />
          ) : (
            <ChartEmptyState minHeight="400px" />
          )}
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
          h="492px"
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
          cardHeight="492px"
          boxProps={{ w: 'full' }}
        />
      </Grid>
      <ReadingComplianceSection
        key={readingComplianceScopeKey}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        villagePumpOperators={villagePumpOperators}
        tenantCode={tenantCode}
        effectiveSchemeId={effectiveSchemeId}
      />
    </>
  )
}
