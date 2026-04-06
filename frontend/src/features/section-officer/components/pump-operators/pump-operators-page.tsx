import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Heading,
  Text,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Button,
  Spinner,
  Tooltip,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { FiEye } from 'react-icons/fi'
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
import { ROUTES } from '@/shared/constants/routes'
import { usePumpOperatorsListQuery } from '../../services/query/use-pump-operators-queries'
import { formatTimestamp } from '../../services/api/schemes-api'
import type { PumpOperatorListItem } from '../../types/pump-operators'

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export function PumpOperatorsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 400)

  const [prevDebounced, setPrevDebounced] = useState(debouncedSearch)
  if (prevDebounced !== debouncedSearch) {
    setPrevDebounced(debouncedSearch)
    setPage(1)
  }

  const hasActiveFilters = Boolean(searchQuery || statusFilter || dateRange)

  function clearAllFilters() {
    setSearchQuery('')
    setStatusFilter('')
    setDateRange(null)
    setPage(1)
  }

  const { data, isLoading, isFetching, isError, refetch } = usePumpOperatorsListQuery(
    page,
    pageSize,
    debouncedSearch,
    statusFilter,
    dateRange?.startDate ?? '',
    dateRange?.endDate ?? ''
  )

  useEffect(() => {
    document.title = 'Pump Operators | JalSoochak'
  }, [])

  const columns: DataTableColumn<PumpOperatorListItem>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.name}
        </Text>
      ),
    },
    {
      key: 'schemes',
      header: 'Schemes',
      render: (row) => {
        const schemes = row.schemes
        if (!schemes || schemes.length === 0) {
          return (
            <Text textStyle="h10" fontWeight="400">
              —
            </Text>
          )
        }
        const firstName = schemes[0].schemeName
        if (schemes.length === 1) {
          return (
            <Text textStyle="h10" fontWeight="400">
              {firstName}
            </Text>
          )
        }
        return (
          <Tooltip
            label={schemes.map((s) => s.schemeName).join(', ')}
            aria-label={`All schemes: ${schemes.map((s) => s.schemeName).join(', ')}`}
            hasArrow
            placement="top"
          >
            <Text textStyle="h10" fontWeight="400" cursor="default">
              {firstName}{' '}
              <Text as="span" color="primary.500" fontWeight="500">
                +{schemes.length - 1}
              </Text>
            </Text>
          </Tooltip>
        )
      },
    },
    {
      key: 'reportingRatePercent',
      header: 'Reporting Rate (%)',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.reportingRatePercent !== null && row.reportingRatePercent !== undefined
            ? `${row.reportingRatePercent}`
            : '—'}
        </Text>
      ),
    },
    {
      key: 'lastSubmissionAt',
      header: 'Last Submission',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.lastSubmissionAt ? formatTimestamp(row.lastSubmissionAt) : '—'}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Activity Status',
      render: (row) => {
        const statusKey = typeof row.status === 'string' ? row.status.toLowerCase() : ''
        const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Active', INACTIVE: 'Inactive' }
        const label = STATUS_LABELS[row.status] ?? row.status
        return <StatusChip status={statusKey} label={label} />
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <ActionTooltip label="View pump operator">
          <IconButton
            aria-label="View pump operator"
            icon={<FiEye aria-hidden="true" size={20} />}
            variant="ghost"
            width={5}
            minW={5}
            height={5}
            color="neutral.950"
            fontWeight="400"
            onClick={() =>
              navigate(ROUTES.STAFF_PUMP_OPERATORS_VIEW.replace(':operatorId', String(row.id)))
            }
            _hover={{ color: 'primary.500', bg: 'transparent' }}
          />
        </ActionTooltip>
      ),
    },
  ]

  if (isLoading) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            Pump Operators
          </Heading>
        </PageHeader>
        <Flex role="status" aria-live="polite" align="center" minH="200px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">Loading…</Text>
        </Flex>
      </Box>
    )
  }

  if (isError) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            Pump Operators
          </Heading>
        </PageHeader>
        <Flex h="64" align="center" justify="center" direction="column" gap={4} role="alert">
          <Text color="error.500">Failed to load pump operators. Please try again.</Text>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </Flex>
      </Box>
    )
  }

  return (
    <Box w="full" maxW="100%" minW={0}>
      <PageHeader>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          Pump Operators
        </Heading>
      </PageHeader>

      <Flex
        as="section"
        aria-label="Filter pump operators"
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
            placeholder="Search by name"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            aria-label="Search by name"
            bg="white"
            h={8}
            borderWidth="1px"
            borderRadius="4px"
            borderColor="neutral.300"
            _placeholder={{ color: 'neutral.300' }}
          />
        </InputGroup>

        <SearchableSelect
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val)
            setPage(1)
          }}
          placeholder="Status"
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
          placeholder="Duration"
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
            clear all filters
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
          data={data?.content ?? []}
          getRowKey={(row) => row.id}
          emptyMessage="No pump operators found."
          pagination={{
            enabled: true,
            page,
            pageSize,
            totalItems: data?.totalElements ?? 0,
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
