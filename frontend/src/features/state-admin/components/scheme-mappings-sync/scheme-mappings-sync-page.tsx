import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import { FiUpload } from 'react-icons/fi'
import { DataTable } from '@/shared/components/common'
import type { DataTableColumn, SortDirection } from '@/shared/components/common'
import type { SchemeMapping } from '../../types/scheme-mappings-sync'
import { useSchemeMappingsListQuery } from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { UploadSchemeMappingsModal } from './upload-scheme-mappings-modal'

const PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 25, 50]

export function SchemeMappingsSyncPage() {
  const { t } = useTranslation('state-admin')
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')

  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [sortDir, setSortDir] = useState<string>('')
  const debouncedSearch = useDebounce(searchQuery, 400)

  useEffect(() => {
    document.title = `${t('schemeMappingsSync.title')} | JalSoochak`
  }, [t])

  const mappingParams = useMemo(
    () => ({
      tenantCode,
      page: page - 1,
      limit: pageSize,
      ...(debouncedSearch ? { schemeName: debouncedSearch } : {}),
      ...(sortDir ? { sortDir } : {}),
    }),
    [tenantCode, page, pageSize, debouncedSearch, sortDir]
  )

  const { data, isLoading, isError, refetch } = useSchemeMappingsListQuery(mappingParams)

  const handleSort = (_columnKey: string, direction: SortDirection) => {
    if (direction === 'asc') {
      setSortDir('asc')
    } else if (direction === 'desc') {
      setSortDir('des')
    } else {
      setSortDir('')
    }
    setPage(1)
  }

  const columns: DataTableColumn<SchemeMapping>[] = [
    {
      key: 'schemeName',
      header: t('schemeMappingsSync.table.schemeName'),
      sortable: true,
      width: '30%',
      minWidth: '200px',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400" overflow="hidden" textOverflow="ellipsis">
          {row.schemeName}
        </Text>
      ),
    },
    {
      key: 'stateSchemeId',
      header: t('schemeMappingsSync.table.stateSchemeId'),
      sortable: false,
      width: '20%',
      minWidth: '140px',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400" overflow="hidden" textOverflow="ellipsis">
          {row.stateSchemeId}
        </Text>
      ),
    },
    {
      key: 'villageName',
      header: t('schemeMappingsSync.table.villageName'),
      sortable: false,
      width: '25%',
      minWidth: '150px',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400" overflow="hidden" textOverflow="ellipsis">
          {row.villageName}
        </Text>
      ),
    },
    {
      key: 'subDivisionName',
      header: t('schemeMappingsSync.table.subDivisionName'),
      sortable: false,
      width: '25%',
      minWidth: '160px',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400" overflow="hidden" textOverflow="ellipsis">
          {row.subDivisionName}
        </Text>
      ),
    },
  ]

  if (isError) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('schemeMappingsSync.title')}
        </Heading>
        <Flex h="64" align="center" justify="center" direction="column" gap={4} role="alert">
          <Text color="error.500">{t('schemeMappingsSync.messages.failedToLoad')}</Text>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            {t('common:retry')}
          </Button>
        </Flex>
      </Box>
    )
  }

  return (
    <Box w="full" maxW="100%" minW={0}>
      {/* Page Header */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('schemeMappingsSync.title')}
        </Heading>
      </Box>

      {/* Toolbar: search + upload */}
      <Flex
        as="section"
        aria-label={t('schemeMappingsSync.aria.filterSection')}
        justify="space-between"
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
        {/* Left: search */}
        <InputGroup w={{ base: 'full', md: '260px' }} flexShrink={0}>
          <InputLeftElement pointerEvents="none" h={8}>
            <SearchIcon color="neutral.300" aria-hidden="true" />
          </InputLeftElement>
          <Input
            placeholder={t('schemeMappingsSync.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            aria-label={t('schemeMappingsSync.aria.searchMappings')}
            bg="white"
            h={8}
            borderWidth="1px"
            borderRadius="4px"
            borderColor="neutral.300"
            _placeholder={{ color: 'neutral.300' }}
          />
        </InputGroup>

        {/* Right: upload */}
        <Button
          variant="secondary"
          size="sm"
          fontWeight="600"
          width="147px"
          flexShrink={0}
          aria-label={t('schemeMappingsSync.aria.uploadData')}
          onClick={() => setIsUploadOpen(true)}
        >
          <FiUpload aria-hidden="true" size={16} style={{ marginRight: '4px', flexShrink: 0 }} />
          {t('schemeMappingsSync.uploadData')}
        </Button>
      </Flex>

      {/* Data Table */}
      <DataTable<SchemeMapping>
        columns={columns}
        data={data?.items ?? []}
        getRowKey={(row) => row.id}
        emptyMessage={t('schemeMappingsSync.messages.noMappingsFound')}
        isLoading={isLoading}
        tableLayout="fixed"
        tableMinWidth="800px"
        onSort={handleSort}
        pagination={{
          enabled: true,
          page,
          pageSize,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          totalItems: data?.totalElements ?? 0,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size)
            setPage(1)
          },
        }}
      />

      <UploadSchemeMappingsModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </Box>
  )
}
