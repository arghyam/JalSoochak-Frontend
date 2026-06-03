import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Text,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import { FiDownload, FiUpload } from 'react-icons/fi'
import { BsDroplet, BsCheck2Circle } from 'react-icons/bs'
import { IoCloseCircleOutline } from 'react-icons/io5'
import {
  DataTable,
  SearchableSelect,
  StatCard,
  PageHeader,
  TruncatedCell,
  ToastContainer,
} from '@/shared/components/common'
import type { DataTableColumn, SortDirection } from '@/shared/components/common'
import type { Scheme } from '../../types/scheme-sync'
import {
  useSchemeCountsQuery,
  useSchemeListQuery,
  useDownloadSchemesReportMutation,
} from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { useToast } from '@/shared/hooks/use-toast'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/shared/constants/pagination'
import { UploadSchemesModal } from './upload-schemes-modal'
import { SchemeStatusChip } from './scheme-status-chip'
import { WORK_STATUS_OPTIONS, OPERATING_STATUS_OPTIONS } from './scheme-status-constants'

export function SchemeSyncPage() {
  const { t } = useTranslation('state-admin')
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')

  const [searchQuery, setSearchQuery] = useState('')
  const [workStatusFilter, setWorkStatusFilter] = useState('')
  const [operatingStatusFilter, setOperatingStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [sortDir, setSortDir] = useState<string>('')
  const debouncedSearch = useDebounce(searchQuery, 400)

  // Reset to page 1 whenever any filter changes.
  // Comparing during render (not in an effect) avoids a cascading re-render.
  const [prevFilters, setPrevFilters] = useState({
    debouncedSearch,
    workStatusFilter,
    operatingStatusFilter,
  })
  if (
    prevFilters.debouncedSearch !== debouncedSearch ||
    prevFilters.workStatusFilter !== workStatusFilter ||
    prevFilters.operatingStatusFilter !== operatingStatusFilter
  ) {
    setPrevFilters({ debouncedSearch, workStatusFilter, operatingStatusFilter })
    setPage(1)
  }

  useEffect(() => {
    document.title = `${t('schemeSync.title')} | JalSoochak`
  }, [t])

  const schemeParams = useMemo(
    () => ({
      tenantCode,
      page: page - 1,
      limit: pageSize,
      workStatus: workStatusFilter,
      operatingStatus: operatingStatusFilter,
      schemeName: debouncedSearch,
      sortDir,
    }),
    [tenantCode, page, pageSize, workStatusFilter, operatingStatusFilter, debouncedSearch, sortDir]
  )

  const { data, isLoading, isError, refetch } = useSchemeListQuery(schemeParams)
  const { data: counts, isLoading: countsLoading } = useSchemeCountsQuery(tenantCode)
  const toast = useToast()
  const { mutate: downloadReport, isPending: isReportPending } = useDownloadSchemesReportMutation()

  const handleReport = () => {
    downloadReport(undefined, {
      onSuccess: async (link) => {
        try {
          const res = await fetch(link, { signal: AbortSignal.timeout(30_000) })
          if (!res.ok) throw new Error(`Download failed: ${res.status}`)
          const contentType = res.headers.get('content-type') ?? ''
          const isValidType = ['text/csv', 'application/csv', 'application/octet-stream'].some(
            (type) => contentType.includes(type)
          )
          if (!isValidType) throw new Error(`Unexpected file type: ${contentType}`)
          const blob = await res.blob()
          const MAX_SIZE = 50 * 1024 * 1024
          if (blob.size > MAX_SIZE) throw new Error('File exceeds 50 MB limit')
          const blobUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = blobUrl
          a.download = 'schemes-report.csv'
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(blobUrl)
          toast.success(t('schemeSync.report.success'))
        } catch {
          toast.error(t('schemeSync.report.error'))
        }
      },
      onError: () => toast.error(t('schemeSync.report.error')),
    })
  }

  const workStatusOptions = WORK_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))
  const operatingStatusOptions = OPERATING_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))

  const hasActiveFilters = workStatusFilter || operatingStatusFilter || searchQuery

  const handleWorkStatusChange = (value: string) => {
    setWorkStatusFilter(value)
  }

  const handleOperatingStatusChange = (value: string) => {
    setOperatingStatusFilter(value)
  }

  const handleClearFilters = () => {
    setWorkStatusFilter('')
    setOperatingStatusFilter('')
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

  const columns: DataTableColumn<Scheme>[] = [
    {
      key: 'schemeName',
      header: t('schemeSync.table.schemeName'),
      sortable: true,
      width: '20%',
      minWidth: '180px',
      headerMaxLines: 2,
      render: (row) => <TruncatedCell value={row.schemeName} />,
    },
    {
      key: 'stateSchemeId',
      header: t('schemeSync.table.stateSchemeId'),
      sortable: false,
      width: '19%',
      minWidth: '100px',
      headerMaxLines: 2,
      render: (row) => <TruncatedCell value={row.stateSchemeId} />,
    },
    {
      key: 'plannedFhtc',
      header: t('schemeSync.table.plannedFhtc'),
      sortable: false,
      width: '10%',
      minWidth: '100px',
      headerMaxLines: 2,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.plannedFhtc}
        </Text>
      ),
    },
    {
      key: 'fhtcCount',
      header: t('schemeSync.table.achievedFhtc'),
      sortable: false,
      width: '10%',
      minWidth: '100px',
      headerMaxLines: 2,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.fhtcCount}
        </Text>
      ),
    },
    {
      key: 'houseHoldCount',
      header: t('schemeSync.table.houseHoldCount'),
      sortable: false,
      width: '10%',
      minWidth: '120px',
      headerMaxLines: 2,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.houseHoldCount}
        </Text>
      ),
    },
    {
      key: 'workStatus',
      header: t('schemeSync.table.workStatus'),
      sortable: false,
      width: '15%',
      minWidth: '170px',
      headerMaxLines: 2,
      render: (row) => (
        <SchemeStatusChip
          schemeId={row.id}
          statusType="workStatus"
          currentValue={row.workStatus}
          tenantCode={tenantCode}
        />
      ),
    },
    {
      key: 'operatingStatus',
      header: t('schemeSync.table.operatingStatus'),
      sortable: false,
      width: '16%',
      minWidth: '180px',
      headerMaxLines: 2,
      render: (row) => (
        <SchemeStatusChip
          schemeId={row.id}
          statusType="operatingStatus"
          currentValue={row.operatingStatus}
          tenantCode={tenantCode}
        />
      ),
    },
  ]

  if (isError) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('schemeSync.title')}
          </Heading>
        </PageHeader>
        <Flex h="64" align="center" justify="center" direction="column" gap={4} role="alert">
          <Text color="error.500">{t('schemeSync.messages.failedToLoad')}</Text>
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
          {t('schemeSync.title')}
        </Heading>
      </PageHeader>

      {/* Toolbar: search + filters + upload */}
      <Flex
        as="section"
        aria-label={t('schemeSync.aria.filterSection')}
        justify="space-between"
        align="flex-start"
        mb={6}
        py={3}
        px={{ base: 3, md: 6 }}
        gap={{ base: 3, md: 4 }}
        flexDirection={{ base: 'column', sm: 'row' }}
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        bg="white"
      >
        {/* Left: search + filters (wraps internally at medium widths) */}
        <Flex align="center" gap={3} flex={1} w="full" flexWrap="wrap">
          <InputGroup w={{ base: 'full', sm: '260px' }} flexShrink={0}>
            <InputLeftElement pointerEvents="none" h={8}>
              <SearchIcon color="neutral.300" aria-hidden="true" />
            </InputLeftElement>
            <Input
              placeholder={t('schemeSync.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
              }}
              aria-label={t('schemeSync.aria.searchSchemes')}
              bg="white"
              h={8}
              borderWidth="1px"
              borderRadius="4px"
              borderColor="neutral.300"
              _placeholder={{ color: 'neutral.300' }}
            />
          </InputGroup>

          <SearchableSelect
            options={workStatusOptions}
            value={workStatusFilter}
            onChange={handleWorkStatusChange}
            placeholder={t('schemeSync.filters.workStatus')}
            width="160px"
            height="32px"
            borderRadius="4px"
            fontSize="sm"
            isFilter
            ariaLabel={t('schemeSync.filters.workStatus')}
            searchable={false}
          />

          <SearchableSelect
            options={operatingStatusOptions}
            value={operatingStatusFilter}
            onChange={handleOperatingStatusChange}
            placeholder={t('schemeSync.filters.operatingStatus')}
            width="175px"
            height="32px"
            borderRadius="4px"
            fontSize="sm"
            isFilter
            ariaLabel={t('schemeSync.filters.operatingStatus')}
            searchable={false}
          />

          {hasActiveFilters && (
            <Button
              variant="link"
              size="sm"
              color="neutral.500"
              fontWeight="400"
              onClick={handleClearFilters}
              _hover={{ color: 'primary.500' }}
            >
              {t('schemeSync.filters.clearAll')}
            </Button>
          )}
        </Flex>

        {/* Right: reports + upload */}
        <Flex gap={2} flexShrink={0} w={{ base: 'full', sm: 'auto' }}>
          <Button
            variant="secondary"
            size="sm"
            fontWeight="600"
            flex={{ base: 1, sm: 'none' }}
            w={{ base: 'auto', sm: '147px' }}
            aria-label={t('schemeSync.report.aria.download')}
            onClick={handleReport}
            isLoading={isReportPending}
            loadingText={t('schemeSync.report.button')}
          >
            <FiDownload
              aria-hidden="true"
              size={16}
              style={{ marginRight: '4px', flexShrink: 0 }}
            />
            {t('schemeSync.report.button')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fontWeight="600"
            flex={{ base: 1, sm: 'none' }}
            w={{ base: 'auto', sm: '147px' }}
            aria-label={t('schemeSync.aria.uploadData')}
            onClick={() => setIsUploadOpen(true)}
          >
            <FiUpload aria-hidden="true" size={16} style={{ marginRight: '4px', flexShrink: 0 }} />
            {t('schemeSync.uploadData')}
          </Button>
        </Flex>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid
        as="section"
        aria-label={t('schemeSync.aria.statsSection')}
        columns={{ base: 1, sm: 3 }}
        spacing={{ base: 4, md: 6 }}
        mb={6}
      >
        <StatCard
          title={t('schemeSync.stats.totalSchemes')}
          value={countsLoading ? '—' : (counts?.totalSchemes ?? 0)}
          icon={BsDroplet}
          iconBg="#EBF4FA"
          iconColor="#3291D1"
        />
        <StatCard
          title={t('schemeSync.stats.activeSchemes')}
          value={countsLoading ? '—' : (counts?.activeSchemes ?? 0)}
          icon={BsCheck2Circle}
          iconBg="#E6F9F0"
          iconColor="#27AE60"
        />
        <StatCard
          title={t('schemeSync.stats.inactiveSchemes')}
          value={countsLoading ? '—' : (counts?.inactiveSchemes ?? 0)}
          icon={IoCloseCircleOutline}
          iconBg="#FEF3F2"
          iconColor="#D94B3E"
        />
      </SimpleGrid>

      {/* Data Table */}
      <DataTable<Scheme>
        columns={columns}
        data={data?.items ?? []}
        getRowKey={(row) => row.id}
        emptyMessage={t('schemeSync.messages.noSchemesFound')}
        isLoading={isLoading}
        tableLayout="fixed"
        tableMinWidth="1100px"
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

      <UploadSchemesModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
