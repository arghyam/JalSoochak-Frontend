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
  useAnomaliesListQuery,
  useAnomalyStatusesQuery,
} from '../../services/query/use-anomalies-queries'
import { formatTimestamp } from '../../services/api/schemes-api'
import type { AnomalyItem } from '../../types/anomalies-escalations'

const TRUNCATE_MAX_CHARS = 30

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

export function AnomaliesPage() {
  const { t } = useTranslation('section-officer')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 400)

  const hasActiveFilters = Boolean(searchQuery || statusFilter || dateRange)

  function clearAllFilters() {
    setSearchQuery('')
    setStatusFilter('')
    setDateRange(null)
    setPage(1)
  }

  const { data: statusesData } = useAnomalyStatusesQuery()

  const statusOptions = (statusesData?.data ?? []).map((s) => ({
    value: String(s.code),
    label: s.label,
  }))

  const { data, isLoading, isFetching, isError, refetch } = useAnomaliesListQuery(
    page,
    pageSize,
    debouncedSearch,
    statusFilter,
    dateRange?.startDate ?? '',
    dateRange?.endDate ?? ''
  )

  useEffect(() => {
    document.title = `${t('pages.anomalies.heading')} ${t('common.documentTitle')}`
  }, [t])

  const columns: DataTableColumn<AnomalyItem>[] = [
    {
      key: 'scheme_name',
      header: t('pages.anomalies.columns.schemeName'),
      render: (row) => <TruncatedCell text={row.scheme_name ?? '—'} />,
    },
    {
      key: 'createdAt',
      header: t('pages.anomalies.columns.dateTime'),
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.createdAt ? formatTimestamp(row.createdAt) : '—'}
        </Text>
      ),
    },
    {
      key: 'type',
      header: t('pages.anomalies.columns.anomalyType'),
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.type ?? '—'}
        </Text>
      ),
    },
    {
      key: 'reason',
      header: t('pages.anomalies.columns.details'),
      render: (row) => {
        const text = row.reason ?? '—'
        return <TruncatedCell text={text} />
      },
    },
    {
      key: 'status',
      header: t('pages.anomalies.columns.status'),
      render: (row) => {
        const statusKey =
          typeof row.status === 'string' ? row.status.toLowerCase().replace(/\s+/g, '-') : ''
        return <StatusChip status={statusKey} label={row.status ?? '—'} />
      },
    },
  ]

  if (isLoading) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('pages.anomalies.heading')}
          </Heading>
        </PageHeader>
        <Flex role="status" aria-live="polite" align="center" minH="200px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">{t('pages.anomalies.loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (isError) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('pages.anomalies.heading')}
          </Heading>
        </PageHeader>
        <Flex h="64" align="center" justify="center" direction="column" gap={4} role="alert">
          <Text color="error.500">{t('pages.anomalies.error')}</Text>
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
          {t('pages.anomalies.heading')}
        </Heading>
      </PageHeader>

      <Flex
        as="section"
        aria-label="Filter anomalies"
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
            placeholder={t('pages.anomalies.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            aria-label={t('pages.anomalies.searchPlaceholder')}
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
            setPage(1)
          }}
          placeholder={t('pages.anomalies.filterStatus')}
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
          placeholder={t('pages.anomalies.filterDuration')}
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
            {t('pages.anomalies.clearAllFilters')}
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
          data={data?.anomalies ?? []}
          getRowKey={(row) => row.id}
          emptyMessage={t('pages.anomalies.noAnomaliesFound')}
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
