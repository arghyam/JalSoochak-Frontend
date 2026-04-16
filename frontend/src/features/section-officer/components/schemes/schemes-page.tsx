import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
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
  const { t } = useTranslation('section-officer')
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

  const { data, isLoading, isFetching, isError, refetch } = useSchemesListQuery(
    page,
    pageSize,
    debouncedSearch
  )

  useEffect(() => {
    document.title = `${t('pages.schemes.heading')} ${t('common.documentTitle')}`
  }, [t])

  const columns: DataTableColumn<SchemesListItem>[] = [
    {
      key: 'schemeName',
      header: t('pages.schemes.columns.schemeName'),
      width: '12.5%',
      render: (row) => (
        <Tooltip label={row.schemeName} openDelay={400} hasArrow placement="top">
          <Text
            textStyle="h10"
            fontWeight="400"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {row.schemeName}
          </Text>
        </Tooltip>
      ),
    },
    {
      key: 'stateSchemeId',
      header: t('pages.schemes.columns.stateSchemeId'),
      width: '12.5%',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.stateSchemeId}
        </Text>
      ),
    },
    {
      key: 'pumpOperators',
      header: t('pages.schemes.columns.pumpOperators'),
      width: '12.5%',
      render: (row) => {
        const names = row.pumpOperatorNames
        if (names.length === 0) {
          return (
            <Text textStyle="h10" fontWeight="400">
              —
            </Text>
          )
        }
        const first = names[0]
        if (names.length === 1) {
          return (
            <Text
              textStyle="h10"
              fontWeight="400"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {first}
            </Text>
          )
        }
        return (
          <Popover trigger="hover" placement="top" isLazy openDelay={0} closeDelay={150}>
            <PopoverTrigger>
              <Text
                textStyle="h10"
                fontWeight="400"
                cursor="default"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {first}{' '}
                <Text as="span" color="primary.500" fontWeight="500">
                  +{names.length - 1}
                </Text>
              </Text>
            </PopoverTrigger>
            <PopoverContent w="auto" minW="200px" maxW="320px" boxShadow="md">
              <PopoverBody maxH="250px" overflowY="auto" p={2}>
                {names.map((name, idx) => (
                  <Text key={idx} textStyle="h10" py={1} px={1}>
                    {name}
                  </Text>
                ))}
              </PopoverBody>
            </PopoverContent>
          </Popover>
        )
      },
    },
    {
      key: 'lastReading',
      header: t('pages.schemes.columns.lastReading'),
      width: '12.5%',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.lastReading}
        </Text>
      ),
    },
    {
      key: 'yesterdayReading',
      header: t('pages.schemes.columns.yesterdayReading'),
      width: '12.5%',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.yesterdayReading}
        </Text>
      ),
    },
    {
      key: 'lastWaterSupplied',
      header: t('pages.schemes.columns.lastWaterSupplied'),
      width: '12.5%',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.lastWaterSupplied ?? '—'}
        </Text>
      ),
    },
    {
      key: 'lastSubmission',
      header: t('pages.schemes.columns.lastSubmission'),
      width: '12.5%',
      render: (row) => {
        const formatted = row.lastReadingAt ? formatTimestamp(row.lastReadingAt) : '—'
        return (
          <Tooltip label={formatted} openDelay={400} hasArrow placement="top">
            <Text
              textStyle="h10"
              fontWeight="400"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {formatted}
            </Text>
          </Tooltip>
        )
      },
    },
    {
      key: 'actions',
      header: t('pages.schemes.columns.actions'),
      width: '12.5%',
      render: (row) => (
        <ActionTooltip label={t('common.viewScheme')}>
          <IconButton
            aria-label={t('common.viewScheme')}
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
            {t('pages.schemes.heading')}
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
            {t('pages.schemes.heading')}
          </Heading>
        </PageHeader>
        <Flex h="64" align="center" justify="center" direction="column" gap={4} role="alert">
          <Text color="error.500">Failed to load schemes. Please try again.</Text>
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
          {t('pages.schemes.heading')}
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
            placeholder={t('pages.schemes.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t('pages.schemes.searchPlaceholder')}
            bg="white"
            h={8}
            borderWidth="1px"
            borderRadius="4px"
            borderColor="neutral.300"
            _placeholder={{ color: 'neutral.300' }}
          />
        </InputGroup>
      </Flex>

      <Box
        position="relative"
        opacity={isFetching && !isLoading ? 0.6 : 1}
        transition="opacity 0.15s"
      >
        <DataTable
          columns={columns}
          data={data?.content ?? []}
          getRowKey={(row) => row.schemeId}
          emptyMessage={t('pages.schemes.noSchemesFound')}
          tableLayout="fixed"
          tableMinWidth="1200px"
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
