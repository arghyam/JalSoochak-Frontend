import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Heading,
  Text,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Spinner,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { useDebounce } from '@/shared/hooks/use-debounce'
import {
  DataTable,
  PageHeader,
  ActionTooltip,
  SearchableSelect,
  DateRangePicker,
  StatusChip,
} from '@/shared/components/common'
import type { DataTableColumn, DateRange } from '@/shared/components/common'
import {
  useEscalationsListQuery,
  useEscalationStatusesQuery,
} from '../../services/query/use-escalations-queries'
import { formatTimestamp } from '../../services/api/schemes-api'
import type { EscalationItem } from '../../types/anomalies-escalations'

const TRUNCATE_MAX_CHARS = 30

function getDefaultDateRange(): DateRange {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const start = new Date(now)
  start.setDate(now.getDate() - 29)
  return { startDate: toIso(start), endDate: toIso(now) }
}

function TruncatedCell({ text }: { text: string }) {
  const isTruncated = text.length > TRUNCATE_MAX_CHARS
  const display = isTruncated ? `${text.slice(0, TRUNCATE_MAX_CHARS)}…` : text

  if (!isTruncated) {
    return (
      <Text textStyle="h10" fontWeight="400">
        {text}
      </Text>
    )
  }

  return (
    <ActionTooltip label={text} aria-label={text}>
      <Text textStyle="h10" fontWeight="400" cursor="default">
        {display}
      </Text>
    </ActionTooltip>
  )
}

export function StaffEscalationsPage() {
  const { t } = useTranslation('section-officer')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | null>(() => getDefaultDateRange())

  const debouncedSearch = useDebounce(searchQuery, 400)

  const [prevDebounced, setPrevDebounced] = useState(debouncedSearch)
  if (prevDebounced !== debouncedSearch) {
    setPrevDebounced(debouncedSearch)
    setPage(1)
  }

  const hasActiveFilters = Boolean(searchQuery || statusFilter)

  function clearAllFilters() {
    setSearchQuery('')
    setStatusFilter('')
    setDateRange(getDefaultDateRange())
    setPage(1)
  }

  const { data: statusesData } = useEscalationStatusesQuery()

  const statusOptions = (statusesData?.data ?? []).map((s) => ({
    value: String(s.code),
    label: s.label,
  }))

  const { data, isLoading, isFetching, isError, refetch } = useEscalationsListQuery(
    page,
    pageSize,
    debouncedSearch,
    statusFilter,
    dateRange?.startDate ?? '',
    dateRange?.endDate ?? ''
  )

  useEffect(() => {
    document.title = `${t('pages.escalations.heading')} ${t('common.documentTitle')}`
  }, [t])

  const columns: DataTableColumn<EscalationItem>[] = [
    {
      key: 'scheme_name',
      header: t('pages.escalations.columns.schemeName'),
      render: (row) => <TruncatedCell text={row.scheme_name ?? '—'} />,
    },
    {
      key: 'createdAt',
      header: t('pages.escalations.columns.dateTime'),
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.createdAt ? formatTimestamp(row.createdAt) : '—'}
        </Text>
      ),
    },
    {
      key: 'escalationType',
      header: t('pages.escalations.columns.escalationType'),
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.escalationType ?? '—'}
        </Text>
      ),
    },
    {
      key: 'message',
      header: t('pages.escalations.columns.details'),
      render: (row) => {
        const text = row.message ?? '—'
        return <TruncatedCell text={text} />
      },
    },
    {
      key: 'resolution_status',
      header: t('pages.escalations.columns.status'),
      render: (row) => {
        const statusKey =
          typeof row.resolution_status === 'string'
            ? row.resolution_status.toLowerCase().replace(/\s+/g, '-')
            : ''
        return <StatusChip status={statusKey} label={row.resolution_status ?? '—'} />
      },
    },
  ]

  if (isLoading) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('pages.escalations.heading')}
          </Heading>
        </PageHeader>
        <Flex role="status" aria-live="polite" align="center" minH="200px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">{t('pages.escalations.loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (isError) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('pages.escalations.heading')}
          </Heading>
        </PageHeader>
        <Flex h="64" align="center" justify="center" direction="column" gap={4} role="alert">
          <Text color="error.500">{t('pages.escalations.error')}</Text>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            {t('common.retry')}
          </Button>
        </Flex>
      </Box>
    )
  }

  return (
    <Box w="full" maxW="100%" minW={0}>
      <PageHeader>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('pages.escalations.heading')}
        </Heading>
      </PageHeader>

      <Flex
        as="section"
        aria-label="Filter escalations"
        justify="flex-start"
        align="center"
        mb={6}
        py={3}
        px={{ base: 3, md: 6 }}
        h={{ base: 'auto', md: 16 }}
        gap={{ base: 3, md: 4 }}
        flexDirection={{ base: 'column', md: 'row' }}
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        bg="white"
      >
        <InputGroup w={{ base: 'full', md: '260px' }} flexShrink={0}>
          <InputLeftElement pointerEvents="none" h={8}>
            <SearchIcon color="neutral.300" aria-hidden="true" />
          </InputLeftElement>
          <Input
            placeholder={t('pages.escalations.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
            }}
            aria-label={t('pages.escalations.searchPlaceholder')}
            bg="white"
            h={8}
            borderWidth="1px"
            borderRadius="4px"
            borderColor="neutral.300"
            _placeholder={{ color: 'neutral.300' }}
          />
        </InputGroup>

        <SearchableSelect
          options={statusOptions}
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val)
          }}
          placeholder={t('pages.escalations.filterStatus')}
          width="160px"
          height="32px"
          borderRadius="4px"
          fontSize="sm"
          textColor="neutral.400"
          borderColor="neutral.400"
          isFilter={Boolean(statusFilter)}
          ariaLabel="Filter by status"
        />

        <DateRangePicker
          value={dateRange}
          onChange={(val) => {
            setDateRange(val)
            setPage(1)
          }}
          placeholder={t('pages.escalations.filterDuration')}
          width="160px"
          height="32px"
          borderRadius="4px"
          fontSize="sm"
          textColor="neutral.400"
          borderColor="neutral.400"
          isFilter={true}
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            color="neutral.500"
            fontWeight="400"
            onClick={clearAllFilters}
            aria-label="Clear all filters"
            _hover={{ color: 'primary.500', bg: 'transparent' }}
          >
            {t('pages.escalations.clearAllFilters')}
          </Button>
        )}
      </Flex>

      <Box
        position="relative"
        opacity={isFetching && !isLoading ? 0.6 : 1}
        transition="opacity 0.15s"
      >
        <DataTable
          columns={columns}
          data={data?.escalations ?? []}
          getRowKey={(row) => row.id}
          emptyMessage={t('pages.escalations.noEscalationsFound')}
          pagination={{
            enabled: true,
            page,
            pageSize,
            totalItems: data?.total_count ?? 0,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size)
              setPage(1)
            },
          }}
        />
      </Box>
    </Box>
  )
}
