import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  Avatar,
  Box,
  Button,
  Flex,
  Grid,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { LuArrowLeft, LuArrowRight, LuChevronDown } from 'react-icons/lu'
import { ChartEmptyState, ChartInfoTooltip } from '@/shared/components/common'
import { buildDashboardGlossary } from '../../utils/dashboard-glossary'
import { formatIsoDateForDisplay, normalizeDateFormat } from '@/shared/utils/date-format'
import type { MonthlyTrendPoint } from '../charts/monthly-trend-chart'
import type {
  DashboardData,
  EntityPerformance,
  PumpOperatorsBySchemeItem,
  ReadingComplianceData,
  ReadingComplianceItem,
  VillagePumpOperatorDetails,
  WaterSupplyOutageData,
} from '../../types'
import { dashboardApi } from '../../services/api/dashboard-api'
import { dashboardQueryKeys } from '../../services/query/dashboard-query-keys'
import { usePumpOperatorDetailsQuery } from '../../services/query/use-pump-operator-details-query'
import { useReadingComplianceQuery } from '../../services/query/use-reading-compliance-query'
import { SupplyOutageReasonsChart } from '../charts'
import { ReadingComplianceTable } from '../tables'
import { PerformanceChartCard } from './performance-chart-card'
import { ReadingSubmissionStatusCard } from './reading-submission-status-card'
import { toCapitalizedWords } from '../../utils/format-location-label'
import { shouldShowSupplyOutageCharts } from '@/config/server-config'

type PerformanceTimeScale = 'day' | 'week' | 'month' | 'quarter' | 'year'

type VillageDashboardScreenProps = {
  data: DashboardData
  villagePhotoEvidenceRows: DashboardData['readingCompliance']
  waterSupplyOutagesData: WaterSupplyOutageData[]
  villagePumpOperatorDetails: VillagePumpOperatorDetails
  villagePumpOperators?: VillagePumpOperatorDetails[]
  tenantCode?: string
  schemeId?: number
  allSchemeIds?: number[]
  startDate?: string
  endDate?: string
  quantityTimeTrendData?: MonthlyTrendPoint[]
  regularityTimeTrendData?: MonthlyTrendPoint[]
  isQuantityTimeTrendLoading?: boolean
  isRegularityTimeTrendLoading?: boolean
  isQuantityTimeTrendError?: boolean
  isRegularityTimeTrendError?: boolean
  isReadingSubmissionStatusError?: boolean
  quantityTimeScaleTab?: PerformanceTimeScale
  onQuantityTimeScaleTabChange?: (value: PerformanceTimeScale) => void
  regularityTimeScaleTab?: PerformanceTimeScale
  onRegularityTimeScaleTabChange?: (value: PerformanceTimeScale) => void
  screenDateFormat?: string
  tableDateFormat?: string
  enableExtendedTimeScales?: boolean
  errorMessage?: string
}

const READING_COMPLIANCE_PAGE_SIZE = 50
const VILLAGE_PERFORMANCE_DATA: EntityPerformance[] = []

const formatReadingComplianceTimestamp = (value?: string | null, dateFormat?: string) => {
  if (!value) {
    return 'N/A'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')
  const datePart = formatIsoDateForDisplay(
    `${year}-${month}-${day}`,
    normalizeDateFormat(dateFormat ?? 'DD/MM/YY')
  )
  const timeParts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(parsedDate)
  const hour = timeParts.find((part) => part.type === 'hour')?.value ?? ''
  const minute = timeParts.find((part) => part.type === 'minute')?.value ?? ''
  const dayPeriod = timeParts.find((part) => part.type === 'dayPeriod')?.value.toLowerCase() ?? ''

  return `${datePart}, ${hour}:${minute}${dayPeriod}`
}

const getReadingComplianceTimestampValue = (item: {
  lastSubmissionAt?: string | null
  readingAt?: string | null
  readingDate?: string | null
}) => item.lastSubmissionAt ?? item.readingAt ?? item.readingDate ?? null

const getReadingAtValue = (item: { readingAt?: string | null }) => item.readingAt ?? ''

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
  fallback?: VillagePumpOperatorDetails,
  tableDateFormat?: string
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
        ? formatReadingComplianceTimestamp(
            getReadingComplianceTimestampValue(item),
            tableDateFormat
          )
        : matchingFallback?.lastSubmission || 'N/A',
    reportingRate:
      item.reportingRatePercent != null
        ? formatPercent(item.reportingRatePercent)
        : matchingFallback?.reportingRate || 'N/A',
    missingSubmissionCount:
      missingSubmissionCount != null
        ? formatCount(missingSubmissionCount)
        : matchingFallback?.missingSubmissionCount || 'N/A',
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
  }
}

const mapPumpOperatorDetailsToVillageDetails = (
  item: {
    id: number
    uuid: string
    name: string
    email: string
    phoneNumber: string
    status: number | string
    schemeId: number
    stateSchemeId?: string | null
    centerSchemeId?: string | null
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
  fallback?: VillagePumpOperatorDetails,
  tableDateFormat?: string
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
    stateSchemeId: item.stateSchemeId ?? null,
    centerSchemeId: item.centerSchemeId ?? null,
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
        ? formatReadingComplianceTimestamp(item.lastSubmissionAt, tableDateFormat)
        : fallback?.lastSubmission || 'N/A',
    reportingRate:
      item.reportingRatePercent != null
        ? formatPercent(item.reportingRatePercent)
        : fallback?.reportingRate || 'N/A',
    missingSubmissionCount:
      missedSubmissionCount != null
        ? formatCount(missedSubmissionCount)
        : fallback?.missingSubmissionCount || 'N/A',
  }
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
  allSchemeIds?: number[]
  startDate?: string
  endDate?: string
  tableDateFormat?: string
}

function ReadingComplianceSection({
  villagePumpOperatorDetails,
  villagePumpOperators,
  tenantCode,
  allSchemeIds = [],
  startDate,
  endDate,
  tableDateFormat,
}: ReadingComplianceSectionProps) {
  const { t } = useTranslation('dashboard')
  const glossary = useMemo(() => buildDashboardGlossary(t), [t])
  const [pumpOperatorPage, setPumpOperatorPage] = useState(1)
  const [readingCompliancePage, setReadingCompliancePage] = useState(0)
  const [loadedReadingCompliancePages, setLoadedReadingCompliancePages] = useState<
    Record<number, ReadingComplianceItem[]>
  >({})
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | undefined>(allSchemeIds[0])

  // Fetch pump operators for every scheme in parallel
  const schemeQueries = useQueries({
    queries: allSchemeIds.map((schemeId) => ({
      queryKey: dashboardQueryKeys.pumpOperatorsByScheme(
        tenantCode ? { tenant_code: tenantCode, scheme_id: schemeId } : null
      ),
      queryFn: () =>
        dashboardApi.getPumpOperatorsByScheme({ tenant_code: tenantCode!, scheme_id: schemeId }),
      enabled: Boolean(tenantCode),
      retry: false,
    })),
  })

  const allPumpOperatorsByScheme = useMemo(
    () => schemeQueries.filter((q) => q.data != null).flatMap((q) => q.data!.data),
    [schemeQueries]
  )

  const schemeOptions = useMemo(
    () =>
      allSchemeIds.map((schemeId) => {
        const found = allPumpOperatorsByScheme.find((item) => item.schemeId === schemeId)
        return {
          value: schemeId,
          label: found?.schemeName ? toCapitalizedWords(found.schemeName) : `Scheme ${schemeId}`,
        }
      }),
    [allSchemeIds, allPumpOperatorsByScheme]
  )

  const fallbackPumpOperatorPages = useMemo(
    () => (villagePumpOperators.length > 0 ? villagePumpOperators : [villagePumpOperatorDetails]),
    [villagePumpOperatorDetails, villagePumpOperators]
  )

  const pumpOperatorApiPages = useMemo(
    () =>
      allPumpOperatorsByScheme
        .filter(
          (schemeGroup) => selectedSchemeId == null || schemeGroup.schemeId === selectedSchemeId
        )
        .flatMap((schemeGroup) =>
          schemeGroup.pumpOperators.map((operator) =>
            mapPumpOperatorSummaryToVillageDetails(
              operator,
              schemeGroup.schemeId,
              schemeGroup.schemeName,
              fallbackPumpOperatorPages.find((fallbackOperator) =>
                isSameOperator(operator, fallbackOperator)
              )
            )
          )
        ),
    [allPumpOperatorsByScheme, fallbackPumpOperatorPages, selectedSchemeId]
  )

  const pumpOperatorPages = useMemo(
    () => (pumpOperatorApiPages.length > 0 ? pumpOperatorApiPages : fallbackPumpOperatorPages),
    [fallbackPumpOperatorPages, pumpOperatorApiPages]
  )

  const totalPumpOperatorPages = Math.max(1, pumpOperatorPages.length)
  const activePumpOperatorPage = Math.min(pumpOperatorPage, totalPumpOperatorPages)
  const activePumpOperator =
    pumpOperatorPages[activePumpOperatorPage - 1] ?? villagePumpOperatorDetails
  const activePumpOperatorKey =
    activePumpOperator.mappingKey ?? getOperatorMappingKey(activePumpOperator)
  const activePumpOperatorId = activePumpOperator.id
  const activePumpOperatorSchemeId = activePumpOperator.schemeId

  // Reset all paging when the selected scheme changes
  const prevSelectedSchemeRef = useRef(selectedSchemeId)
  useEffect(() => {
    if (prevSelectedSchemeRef.current !== selectedSchemeId) {
      prevSelectedSchemeRef.current = selectedSchemeId
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPumpOperatorPage(1)
      setReadingCompliancePage(0)
      setLoadedReadingCompliancePages({})
    }
  }, [selectedSchemeId])

  const activePumpOperatorDetailsParams = useMemo(
    () =>
      tenantCode &&
      typeof activePumpOperatorId === 'number' &&
      typeof activePumpOperatorSchemeId === 'number' &&
      startDate &&
      endDate
        ? {
            tenant_code: tenantCode,
            pumpOperatorId: activePumpOperatorId,
            scheme_id: activePumpOperatorSchemeId,
            startDate,
            endDate,
          }
        : null,
    [activePumpOperatorId, activePumpOperatorSchemeId, endDate, startDate, tenantCode]
  )

  const readingComplianceParams = useMemo(
    () =>
      tenantCode && typeof selectedSchemeId === 'number'
        ? {
            tenant_code: tenantCode,
            scheme_id: selectedSchemeId,
            startDate,
            endDate,
            page: readingCompliancePage,
            size: READING_COMPLIANCE_PAGE_SIZE,
          }
        : null,
    [selectedSchemeId, endDate, readingCompliancePage, startDate, tenantCode]
  )

  const { data: pumpOperatorDetailsApiData } = usePumpOperatorDetailsQuery({
    params: activePumpOperatorDetailsParams,
    enabled: Boolean(activePumpOperatorDetailsParams),
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
    // Snapshots fetched pages into local state so older history remains
    // available while newer pages are loading (infinite scroll accumulation).
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

  const resolvedActivePumpOperator = useMemo(() => {
    const detailsPayload = pumpOperatorDetailsApiData?.data

    if (detailsPayload) {
      return mapPumpOperatorDetailsToVillageDetails(
        detailsPayload,
        activePumpOperator,
        tableDateFormat
      )
    }

    // Fall back to the latest compliance row for display purposes
    const latestComplianceItem = readingComplianceItems[0]
    if (latestComplianceItem) {
      return mapReadingComplianceItemToVillageDetails(
        latestComplianceItem,
        activePumpOperator,
        tableDateFormat
      )
    }

    return activePumpOperator
  }, [
    activePumpOperator,
    pumpOperatorDetailsApiData?.data,
    readingComplianceItems,
    tableDateFormat,
  ])

  // Reading compliance is fetched per scheme; rows belong to the selected scheme.
  const readingComplianceRows = useMemo(() => {
    const apiRows: ReadingComplianceData[] = readingComplianceItems.map((item, index) => ({
      id: [
        item.schemeId ?? selectedSchemeId ?? 'scheme',
        item.id,
        item.readingAt ?? item.lastSubmissionAt ?? 'no-timestamp',
        item.confirmedReading ?? 'no-reading',
        index,
      ].join('-'),
      name: item.name?.trim() || 'N/A',
      village: 'N/A',
      lastSubmission: formatReadingComplianceTimestamp(
        getReadingComplianceTimestampValue(item),
        tableDateFormat
      ),
      readingAt: getReadingAtValue(item),
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
        readingAt:
          resolvedActivePumpOperator.lastSubmissionAt ??
          resolvedActivePumpOperator.lastSubmission ??
          '',
        readingValue: 'N/A',
      },
    ]
  }, [
    activePumpOperatorKey,
    selectedSchemeId,
    readingComplianceItems,
    resolvedActivePumpOperator,
    tableDateFormat,
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
          !isMissingDisplayValue(row.readingAt) ||
          !isMissingDisplayValue(row.readingValue)
      ),
    [readingComplianceRows]
  )

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

  const activeSchemeLabel =
    schemeOptions.find((opt) => opt.value === selectedSchemeId)?.label ??
    (selectedSchemeId != null ? `Scheme ${selectedSchemeId}` : '')

  const schemeDropdown =
    allSchemeIds.length > 1 ? (
      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<LuChevronDown size={16} />}
          h="32px"
          px="12px"
          fontSize="16px"
          fontWeight="500"
          justifyContent="space-between"
          textAlign="left"
          marginRight="2px"
          borderRadius="4px"
          borderColor="primary.500"
          borderWidth="1px"
          bg="white"
          color="primary.500"
          _hover={{ borderColor: 'primary.500', bg: 'white' }}
          _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
          _active={{ bg: 'white' }}
          aria-label={t('pumpOperators.details.ariaSchemeSelect', {
            defaultValue: 'Select scheme',
          })}
        >
          {activeSchemeLabel}
        </MenuButton>
        <MenuList minW="180px" py={1}>
          {schemeOptions.map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => setSelectedSchemeId(option.value)}
              fontSize="16px"
              bg="white"
              color="neutral.900"
              fontWeight="500"
              _hover={{ bg: 'neutral.100' }}
              _focus={{ bg: 'neutral.100' }}
            >
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    ) : null

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
        h="430px"
        minW={0}
        overflow="hidden"
      >
        <Flex direction="column" h="full">
          <Flex align="center" gap="6px" mb={4}>
            <Text textStyle="bodyText3" fontWeight="400">
              {t('pumpOperators.details.title', {
                defaultValue: 'Pump Operator Details',
              })}
            </Text>
            <ChartInfoTooltip
              tooltipContent={glossary.pumpOperatorDetails}
              ariaLabel={t('pumpOperators.details.ariaPumpOperatorDetails', {
                defaultValue: 'Pump operator details info',
              })}
            />
          </Flex>
          {isPumpOperatorDetailsEmpty ? (
            <Box flex={1} minH={0} display="flex">
              <ChartEmptyState minHeight="100%" />
            </Box>
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
                  {t('pumpOperators.details.fields.stateSchemeId', {
                    defaultValue: 'State Scheme ID',
                  })}
                </Text>
                <Text
                  textStyle="bodyText4"
                  fontWeight="400"
                  color="neutral.950"
                  textAlign={{ base: 'left', sm: 'right' }}
                  wordBreak="break-word"
                >
                  {resolvedActivePumpOperator.stateSchemeId ?? 'N/A'}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.centerSchemeId', {
                    defaultValue: 'Center Scheme ID',
                  })}
                </Text>
                <Text
                  textStyle="bodyText4"
                  fontWeight="400"
                  color="neutral.950"
                  textAlign={{ base: 'left', sm: 'right' }}
                  wordBreak="break-word"
                >
                  {resolvedActivePumpOperator.centerSchemeId ?? 'N/A'}
                </Text>
                <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                  {t('pumpOperators.details.fields.schemeName', {
                    defaultValue: 'Scheme name',
                  })}
                </Text>
                <Text
                  textStyle="bodyText4"
                  fontWeight="400"
                  color="neutral.950"
                  textAlign={{ base: 'left', sm: 'right' }}
                  wordBreak="break-word"
                >
                  {resolvedActivePumpOperator.schemeName ||
                    resolvedActivePumpOperator.scheme ||
                    'N/A'}
                </Text>
                <Flex align="center" gap="4px">
                  <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                    {t('pumpOperators.details.fields.lastSubmission', {
                      defaultValue: 'Last submission',
                    })}
                  </Text>
                  <ChartInfoTooltip
                    tooltipContent={glossary.pumpOperatorLastSubmission}
                    ariaLabel={t('pumpOperators.details.ariaLastSubmission', {
                      defaultValue: 'Last submission info',
                    })}
                  />
                </Flex>
                <Text
                  textStyle="bodyText4"
                  fontWeight="400"
                  color="neutral.950"
                  textAlign={{ base: 'left', sm: 'right' }}
                >
                  {resolvedActivePumpOperator.lastSubmission}
                </Text>
                <Flex align="center" gap="4px">
                  <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                    {t('pumpOperators.details.fields.reportingRate', {
                      defaultValue: 'Reporting rate',
                    })}
                  </Text>
                  <ChartInfoTooltip
                    tooltipContent={glossary.pumpOperatorReportingRate}
                    ariaLabel={t('pumpOperators.details.ariaReportingRate', {
                      defaultValue: 'Reporting rate info',
                    })}
                  />
                </Flex>
                <Text
                  textStyle="bodyText4"
                  fontWeight="400"
                  color="neutral.950"
                  textAlign={{ base: 'left', sm: 'right' }}
                >
                  {resolvedActivePumpOperator.reportingRate}
                </Text>
                <Flex align="center" gap="4px">
                  <Text textStyle="bodyText4" fontWeight="400" color="neutral.600">
                    {t('pumpOperators.details.fields.missingSubmissionCount', {
                      defaultValue: 'Missing submission count',
                    })}
                  </Text>
                  <ChartInfoTooltip
                    tooltipContent={glossary.pumpOperatorMissingSubmissions}
                    ariaLabel={t('pumpOperators.details.ariaMissingSubmissionCount', {
                      defaultValue: 'Missing submission count info',
                    })}
                  />
                </Flex>
                <Text
                  textStyle="bodyText4"
                  fontWeight="400"
                  color="neutral.950"
                  textAlign={{ base: 'left', sm: 'right' }}
                >
                  {resolvedActivePumpOperator.missingSubmissionCount}
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
          dateFormat={tableDateFormat}
          showVillageColumn={false}
          scrollAreaMaxH="320px"
          fillHeight
          onReachEnd={
            hasMeaningfulReadingComplianceRows ? handleReachReadingComplianceEnd : undefined
          }
          title={t('outageAndSubmissionCharts.titles.readingCompliance', {
            defaultValue: 'Reading Compliance',
          })}
          tooltipContent={glossary.readingCompliance}
          headerRight={schemeDropdown}
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
  allSchemeIds,
  startDate,
  endDate,
  quantityTimeTrendData = [],
  regularityTimeTrendData = [],
  isQuantityTimeTrendLoading = false,
  isRegularityTimeTrendLoading = false,
  isQuantityTimeTrendError = false,
  isRegularityTimeTrendError = false,
  isReadingSubmissionStatusError = false,
  quantityTimeScaleTab,
  onQuantityTimeScaleTabChange,
  regularityTimeScaleTab,
  onRegularityTimeScaleTabChange,
  screenDateFormat,
  tableDateFormat,
  enableExtendedTimeScales = true,
  errorMessage = 'Failed to load data. Please reload the page.',
}: VillageDashboardScreenProps) {
  const { t } = useTranslation('dashboard')
  const glossary = useMemo(() => buildDashboardGlossary(t), [t])
  const showSupplyOutageCharts = shouldShowSupplyOutageCharts()
  const effectiveAllSchemeIds =
    allSchemeIds && allSchemeIds.length > 0
      ? allSchemeIds
      : schemeId != null
        ? [schemeId]
        : villagePumpOperatorDetails.schemeId != null
          ? [villagePumpOperatorDetails.schemeId]
          : []

  const readingComplianceScopeKey = `${tenantCode ?? 'no-tenant'}:${[...effectiveAllSchemeIds].sort().join(',')}`

  return (
    <>
      <Grid templateColumns="1fr" gap={6} mb={6}>
        <PerformanceChartCard
          title={t('performanceCharts.regularity.title', {
            defaultValue: 'Regularity Performance',
          })}
          viewByAriaLabel={t('performanceCharts.regularity.ariaViewByVillage', {
            defaultValue: 'Village regularity performance view by',
          })}
          viewBy="time"
          onViewByChange={() => undefined}
          data={VILLAGE_PERFORMANCE_DATA}
          metric="regularity"
          timeTrendData={regularityTimeTrendData}
          isTimeTrendLoading={isRegularityTimeTrendLoading}
          isTimeTrendError={isRegularityTimeTrendError}
          entityLabel={t('performanceCharts.viewBy.villages', { defaultValue: 'Villages' })}
          yAxisLabel={t('performanceCharts.regularity.yAxisLabel', {
            defaultValue: 'Regularity',
          })}
          seriesName={t('performanceCharts.regularity.seriesName', {
            defaultValue: 'Regularity',
          })}
          cardHeight="492px"
          timeXAxisLabel={t('performanceCharts.viewBy.time', { defaultValue: 'Time' })}
          isTimeTrendPercent
          regularityTimeScaleTab={regularityTimeScaleTab}
          onRegularityTimeScaleTabChange={onRegularityTimeScaleTabChange}
          dateFormat={screenDateFormat ?? tableDateFormat}
          enableExtendedTimeScales={enableExtendedTimeScales}
          hideViewBySelect
          errorMessage={errorMessage}
          tooltipContent={glossary.regularityPerformance}
        />
        <PerformanceChartCard
          title={t('performanceCharts.quantity.title', { defaultValue: 'Quantity Performance' })}
          viewByAriaLabel={t('performanceCharts.quantity.ariaViewByVillage', {
            defaultValue: 'Village quantity performance view by',
          })}
          viewBy="time"
          onViewByChange={() => undefined}
          data={VILLAGE_PERFORMANCE_DATA}
          metric="quantity"
          timeTrendData={quantityTimeTrendData}
          isTimeTrendLoading={isQuantityTimeTrendLoading}
          isTimeTrendError={isQuantityTimeTrendError}
          entityLabel={t('performanceCharts.viewBy.villages', { defaultValue: 'Villages' })}
          yAxisLabel={t('performanceCharts.quantity.yAxisLabel', { defaultValue: 'Quantity' })}
          seriesName={t('performanceCharts.quantity.seriesName', { defaultValue: 'Quantity' })}
          cardHeight="492px"
          showAreaLine
          areaSeriesName={t('performanceCharts.quantity.areaSeriesName', {
            defaultValue: 'Demand',
          })}
          timeXAxisLabel={t('performanceCharts.viewBy.time', { defaultValue: 'Time' })}
          quantityTimeScaleTab={quantityTimeScaleTab}
          onQuantityTimeScaleTabChange={onQuantityTimeScaleTabChange}
          dateFormat={screenDateFormat ?? tableDateFormat}
          enableExtendedTimeScales={enableExtendedTimeScales}
          hideViewBySelect
          errorMessage={errorMessage}
          tooltipContent={glossary.quantityPerformance}
        />
      </Grid>
      <Grid
        templateColumns={showSupplyOutageCharts ? { base: '1fr', lg: 'repeat(2, 1fr)' } : '1fr'}
        gap={6}
        mb={6}
      >
        {/* Supply outage charts temporarily hidden; set SHOW_SUPPLY_OUTAGE_CHARTS to true to restore. */}
        {showSupplyOutageCharts ? (
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
            <SupplyOutageReasonsChart
              data={waterSupplyOutagesData}
              height="400px"
              tooltipContent={glossary.supplyOutageReasons}
            />
          </Box>
        ) : null}
        <ReadingSubmissionStatusCard
          data={data.readingSubmissionStatus}
          errorMessage={isReadingSubmissionStatusError ? errorMessage : undefined}
          chartHeight="406px"
          cardHeight="492px"
          boxProps={{ w: 'full' }}
          tooltipContent={glossary.readingSubmissionStatus}
        />
      </Grid>
      <ReadingComplianceSection
        key={readingComplianceScopeKey}
        villagePumpOperatorDetails={villagePumpOperatorDetails}
        villagePumpOperators={villagePumpOperators}
        tenantCode={tenantCode}
        allSchemeIds={effectiveAllSchemeIds}
        startDate={startDate}
        endDate={endDate}
        tableDateFormat={tableDateFormat}
      />
    </>
  )
}
