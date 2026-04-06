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
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { FiEye } from 'react-icons/fi'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { DataTable, PageHeader, ActionTooltip } from '@/shared/components/common'
import type { DataTableColumn } from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import { useSchemesListQuery } from '../../services/query/use-schemes-queries'
import { formatTimestamp } from '../../services/api/schemes-api'
import type { SchemesListItem } from '../../types/schemes'

export function SchemesPage() {
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

  const { data, isLoading, isError, refetch } = useSchemesListQuery(page, pageSize, debouncedSearch)

  useEffect(() => {
    document.title = 'All Schemes | JalSoochak'
  }, [])

  const columns: DataTableColumn<SchemesListItem>[] = [
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
      key: 'pumpOperators',
      header: 'Pump Operators',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.pumpOperatorNames.length > 0 ? row.pumpOperatorNames.join(', ') : '—'}
        </Text>
      ),
    },
    {
      key: 'lastReading',
      header: 'Last Reading',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.lastReading}
        </Text>
      ),
    },
    {
      key: 'yesterdayReading',
      header: "Yesterday's Reading",
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.yesterdayReading}
        </Text>
      ),
    },
    {
      key: 'lastWaterSupplied',
      header: 'Last Water Supplied',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.lastWaterSupplied !== null && row.lastWaterSupplied !== undefined
            ? row.lastWaterSupplied
            : '—'}
        </Text>
      ),
    },
    {
      key: 'lastSubmission',
      header: 'Last Submission',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.lastReadingAt ? formatTimestamp(row.lastReadingAt) : '—'}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <ActionTooltip label="View scheme">
          <IconButton
            aria-label="View scheme"
            icon={<FiEye aria-hidden="true" size={20} />}
            variant="ghost"
            width={5}
            minW={5}
            height={5}
            color="neutral.950"
            fontWeight="400"
            onClick={() =>
              navigate(ROUTES.STAFF_SCHEMES_VIEW.replace(':schemeId', String(row.schemeId)))
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
            All Schemes
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
            All Schemes
          </Heading>
        </PageHeader>
        <Flex h="64" align="center" justify="center" direction="column" gap={4} role="alert">
          <Text color="error.500">Failed to load schemes. Please try again.</Text>
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
          All Schemes
        </Heading>
      </PageHeader>

      {/* Toolbar: search filter */}
      <Flex
        as="section"
        aria-label="Filter schemes"
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

      <DataTable
        columns={columns}
        data={data?.content ?? []}
        getRowKey={(row) => row.schemeId}
        emptyMessage="No schemes found."
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
  )
}
