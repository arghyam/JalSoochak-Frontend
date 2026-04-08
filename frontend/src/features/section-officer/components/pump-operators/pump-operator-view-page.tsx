import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Heading,
  Text,
  Flex,
  SimpleGrid,
  Spinner,
  Button,
  Link,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { DataTable, PageHeader } from '@/shared/components/common'
import type { DataTableColumn } from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import {
  usePumpOperatorDetailsQuery,
  usePumpOperatorReadingsQuery,
} from '../../services/query/use-pump-operators-queries'
import { formatTimestamp } from '../../services/api/schemes-api'
import type { PumpOperatorReading } from '../../types/pump-operators'

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text textStyle="h10" fontWeight="500" mb={1}>
        {label}
      </Text>
      <Text textStyle="h10" fontWeight="400">
        {value}
      </Text>
    </Box>
  )
}

export function PumpOperatorViewPage() {
  const { operatorId } = useParams<{ operatorId: string }>()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 400)

  const [prevDebounced, setPrevDebounced] = useState(debouncedSearch)
  if (prevDebounced !== debouncedSearch) {
    setPrevDebounced(debouncedSearch)
    setPage(1)
  }

  const {
    data: details,
    isLoading: detailsLoading,
    isError: detailsError,
    refetch: refetchDetails,
  } = usePumpOperatorDetailsQuery(operatorId)

  const {
    data: readings,
    isLoading: readingsLoading,
    isError: readingsError,
    refetch: refetchReadings,
  } = usePumpOperatorReadingsQuery(operatorId, page, pageSize, debouncedSearch)

  useEffect(() => {
    document.title = details ? `${details.name} | JalSoochak` : 'View Pump Operator | JalSoochak'
  }, [details])

  const readingsColumns: DataTableColumn<PumpOperatorReading>[] = [
    {
      key: 'schemeName',
      header: 'Scheme Name',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.schemeName}
        </Text>
      ),
    },
    {
      key: 'stateSchemeId',
      header: 'State Scheme ID',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.stateSchemeId}
        </Text>
      ),
    },
    {
      key: 'readingAt',
      header: 'Submission Date & Time',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.readingAt ? formatTimestamp(row.readingAt) : '—'}
        </Text>
      ),
    },
    {
      key: 'waterSupplied',
      header: 'Water Supplied',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.waterSupplied !== null && row.waterSupplied !== undefined ? row.waterSupplied : '—'}
        </Text>
      ),
    },
    {
      key: 'readingValue',
      header: 'Reading Value',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.readingValue}
        </Text>
      ),
    },
  ]

  return (
    <Box w="full" maxW="100%" minW={0}>
      <PageHeader>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          Pump Operators
        </Heading>
        <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
          <Link
            fontSize="14px"
            lineHeight="21px"
            color="neutral.500"
            _hover={{ textDecoration: 'underline' }}
            onClick={() => navigate(ROUTES.STAFF_PUMP_OPERATORS)}
            cursor="pointer"
          >
            Pump Operators
          </Link>
          <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
            /
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
            View Pump Operator
          </Text>
        </Flex>
      </PageHeader>

      {detailsLoading && (
        <Flex role="status" aria-live="polite" align="center" minH="200px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">Loading pump operator details…</Text>
        </Flex>
      )}

      {detailsError && (
        <Flex align="flex-start" direction="column" gap={3} mt={4} role="alert">
          <Text color="red.500">Failed to load pump operator details.</Text>
          <Button variant="secondary" size="sm" onClick={() => void refetchDetails()}>
            Retry
          </Button>
        </Flex>
      )}

      {!detailsLoading && !detailsError && details && (
        <Box
          bg="white"
          borderWidth="0.5px"
          borderColor="neutral.200"
          borderRadius="12px"
          w="full"
          py={6}
          px={{ base: 3, md: 4 }}
          mb={6}
        >
          <Heading as="h2" size="h3" fontWeight="400" mb={6}>
            Pump Operator Details
          </Heading>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <DetailField label="Name" value={details.name} />
            <DetailField label="Phone Number" value={details.phoneNumber ?? '—'} />
            <DetailField
              label="Reporting rate"
              value={
                details.reportingRatePercent !== null && details.reportingRatePercent !== undefined
                  ? `${details.reportingRatePercent}%`
                  : '—'
              }
            />
            <DetailField
              label="Last submission"
              value={details.lastSubmissionAt ? formatTimestamp(details.lastSubmissionAt) : '—'}
            />
          </SimpleGrid>
        </Box>
      )}

      <Flex
        as="section"
        aria-label="Filter readings"
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
            placeholder="Search by scheme name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search by scheme name"
            bg="white"
            h={8}
            borderWidth="1px"
            borderRadius="4px"
            borderColor="neutral.300"
            _placeholder={{ color: 'neutral.300' }}
          />
        </InputGroup>
      </Flex>

      {readingsLoading && (
        <Flex role="status" aria-live="polite" align="center" minH="120px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">Loading readings…</Text>
        </Flex>
      )}

      {readingsError && (
        <Flex align="flex-start" direction="column" gap={3} mt={4} role="alert">
          <Text color="red.500">Failed to load readings.</Text>
          <Button variant="secondary" size="sm" onClick={() => void refetchReadings()}>
            Retry
          </Button>
        </Flex>
      )}

      {!readingsLoading && !readingsError && (
        <DataTable
          columns={readingsColumns}
          data={readings?.content ?? []}
          getRowKey={(row) => `${row.schemeId}-${row.readingAt}`}
          emptyMessage="No readings found."
          pagination={{
            enabled: true,
            page,
            pageSize,
            totalItems: readings?.totalElements ?? 0,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size)
              setPage(1)
            },
          }}
        />
      )}
    </Box>
  )
}
