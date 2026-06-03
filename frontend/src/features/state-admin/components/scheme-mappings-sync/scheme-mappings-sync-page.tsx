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
import { FiDownload, FiUpload } from 'react-icons/fi'
import { DataTable, PageHeader, TruncatedCell, ToastContainer } from '@/shared/components/common'
import type { DataTableColumn, SortDirection } from '@/shared/components/common'
import type { SchemeMapping } from '../../types/scheme-mappings-sync'
import {
  useSchemeMappingsListQuery,
  useDownloadSchemeMappingsReportMutation,
} from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { useToast } from '@/shared/hooks/use-toast'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/shared/constants/pagination'
import { UploadSchemeMappingsModal } from './upload-scheme-mappings-modal'

export function SchemeMappingsSyncPage() {
  const { t } = useTranslation('state-admin')
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')

  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [sortDir, setSortDir] = useState<string>('')
  const debouncedSearch = useDebounce(searchQuery, 400)

  // Reset to page 1 whenever the debounced search term changes.
  // Comparing during render (not in an effect) avoids a cascading re-render.
  const [prevDebouncedSearch, setPrevDebouncedSearch] = useState(debouncedSearch)
  if (prevDebouncedSearch !== debouncedSearch) {
    setPrevDebouncedSearch(debouncedSearch)
    setPage(1)
  }

  useEffect(() => {
    document.title = `${t('schemeMappingsSync.title')} | JalSoochak`
  }, [t])

  const mappingParams = useMemo(
    () => ({
      tenantCode,
      page: page - 1,
      limit: pageSize,
      schemeName: debouncedSearch,
      sortDir,
    }),
    [tenantCode, page, pageSize, debouncedSearch, sortDir]
  )

  const { data, isLoading, isError, refetch } = useSchemeMappingsListQuery(mappingParams)
  const toast = useToast()
  const { mutate: downloadReport, isPending: isReportPending } =
    useDownloadSchemeMappingsReportMutation()

  const handleReport = () => {
    downloadReport(undefined, {
      onSuccess: async (link) => {
        try {
          const res = await fetch(link)
          const blob = await res.blob()
          const blobUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = blobUrl
          a.download = 'scheme-mappings-report.csv'
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(blobUrl)
          toast.success(t('schemeMappingsSync.report.success'))
        } catch {
          window.open(link, '_blank', 'noopener,noreferrer')
          toast.success(t('schemeMappingsSync.report.success'))
        }
      },
      onError: () => toast.error(t('schemeMappingsSync.report.error')),
    })
  }

  const hasActiveFilters = Boolean(searchQuery)

  const handleClearFilters = () => {
    setSearchQuery('')
  }

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
      render: (row) => <TruncatedCell value={row.schemeName} />,
    },
    {
      key: 'stateSchemeId',
      header: t('schemeMappingsSync.table.stateSchemeId'),
      sortable: false,
      width: '20%',
      minWidth: '140px',
      render: (row) => <TruncatedCell value={row.stateSchemeId} />,
    },
    {
      key: 'villageName',
      header: t('schemeMappingsSync.table.villageName'),
      sortable: false,
      width: '25%',
      minWidth: '150px',
      render: (row) => <TruncatedCell value={row.villageName} />,
    },
    {
      key: 'subDivisionName',
      header: t('schemeMappingsSync.table.subDivisionName'),
      sortable: false,
      width: '25%',
      minWidth: '160px',
      render: (row) => <TruncatedCell value={row.subDivisionName} />,
    },
  ]

  if (isError) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('schemeMappingsSync.title')}
          </Heading>
        </PageHeader>
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
      <PageHeader>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('schemeMappingsSync.title')}
        </Heading>
      </PageHeader>

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
        {/* Left: search + clear */}
        <Flex align="center" gap={3} flex={1} flexWrap="wrap">
          <InputGroup w={{ base: 'full', md: '260px' }} flexShrink={0}>
            <InputLeftElement pointerEvents="none" h={8}>
              <SearchIcon color="neutral.300" aria-hidden="true" />
            </InputLeftElement>
            <Input
              placeholder={t('schemeMappingsSync.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
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

          {hasActiveFilters && (
            <Button
              variant="link"
              size="sm"
              color="neutral.500"
              fontWeight="400"
              onClick={handleClearFilters}
              _hover={{ color: 'primary.500' }}
            >
              {t('schemeMappingsSync.filters.clearAll')}
            </Button>
          )}
        </Flex>

        {/* Right: reports + upload */}
        <Flex gap={2} flexShrink={0} w={{ base: 'full', md: 'auto' }}>
          <Button
            variant="secondary"
            size="sm"
            fontWeight="600"
            flex={{ base: 1, md: 'none' }}
            w={{ base: 'auto', md: '147px' }}
            aria-label={t('schemeMappingsSync.report.aria.download')}
            onClick={handleReport}
            isLoading={isReportPending}
            loadingText={t('schemeMappingsSync.report.button')}
          >
            <FiDownload
              aria-hidden="true"
              size={16}
              style={{ marginRight: '4px', flexShrink: 0 }}
            />
            {t('schemeMappingsSync.report.button')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fontWeight="600"
            flex={{ base: 1, md: 'none' }}
            w={{ base: 'auto', md: '147px' }}
            flexShrink={0}
            aria-label={t('schemeMappingsSync.aria.uploadData')}
            onClick={() => setIsUploadOpen(true)}
          >
            <FiUpload aria-hidden="true" size={16} style={{ marginRight: '4px', flexShrink: 0 }} />
            {t('schemeMappingsSync.uploadData')}
          </Button>
        </Flex>
      </Flex>

      {/* Data Table */}
      <DataTable<SchemeMapping>
        columns={columns}
        data={data?.items ?? []}
        getRowKey={(row) => `${row.id}-${row.villageLgdCode}`}
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
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
