import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
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
import { FiUpload } from 'react-icons/fi'
import { MdOutlineListAlt } from 'react-icons/md'
import {
  DataTable,
  SearchableSelect,
  StatCard,
  ToastContainer,
  UploadFileModal,
} from '@/shared/components/common'
import type { DataTableColumn, ValidationFieldError } from '@/shared/components/common'
import type { Scheme } from '../../types/scheme-sync'
import {
  useSchemeCountsQuery,
  useSchemeListQuery,
  useUploadSchemesMutation,
} from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'
import { useToast } from '@/shared/hooks/use-toast'

const PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 25, 50]

export function SchemeSyncPage() {
  const { t } = useTranslation('state-admin')
  const toast = useToast()
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')

  const [searchQuery, setSearchQuery] = useState('')
  const [workStatusFilter, setWorkStatusFilter] = useState('')
  const [operatingStatusFilter, setOperatingStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadValidationErrors, setUploadValidationErrors] = useState<ValidationFieldError[]>([])

  useEffect(() => {
    document.title = `${t('schemeSync.title')} | JalSoochak`
  }, [t])

  const schemeParams = useMemo(
    () => ({
      tenantCode,
      page: page - 1,
      limit: pageSize,
      ...(workStatusFilter ? { workStatus: workStatusFilter } : {}),
      ...(operatingStatusFilter ? { operatingStatus: operatingStatusFilter } : {}),
    }),
    [tenantCode, page, pageSize, workStatusFilter, operatingStatusFilter]
  )

  const { data, isLoading, isError, refetch } = useSchemeListQuery(schemeParams)
  const { data: counts, isLoading: countsLoading } = useSchemeCountsQuery(tenantCode)
  const { mutate: upload, isPending: isUploading } = useUploadSchemesMutation()

  const workStatusOptions = useMemo(
    () =>
      (counts?.workStatusCounts ?? []).map((s) => ({
        value: s.status,
        label: s.status,
      })),
    [counts]
  )

  const operatingStatusOptions = useMemo(
    () =>
      (counts?.operatingStatusCounts ?? []).map((s) => ({
        value: s.status,
        label: s.status,
      })),
    [counts]
  )

  const hasActiveFilters = workStatusFilter || operatingStatusFilter

  const handleWorkStatusChange = (value: string) => {
    setWorkStatusFilter(value)
    setPage(1)
  }

  const handleOperatingStatusChange = (value: string) => {
    setOperatingStatusFilter(value)
    setPage(1)
  }

  const handleClearFilters = () => {
    setWorkStatusFilter('')
    setOperatingStatusFilter('')
    setPage(1)
  }

  const displayedSchemes = useMemo(() => {
    if (!data) return []
    if (!searchQuery) return data.items
    return data.items.filter((s) => s.schemeName.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [data, searchQuery])

  const handleUpload = (file: File) => {
    setUploadValidationErrors([])
    upload(
      { file, tenantCode },
      {
        onSuccess: () => {
          toast.success(t('schemeSync.upload.success'))
          setIsUploadOpen(false)
        },
        onError: (error: unknown) => {
          if (axios.isAxiosError(error)) {
            const data = error.response?.data as
              | { fieldErrors?: ValidationFieldError[] }
              | undefined
            if (data?.fieldErrors?.length) {
              setUploadValidationErrors(data.fieldErrors)
              return
            }
          }
          toast.error(t('schemeSync.upload.error'))
        },
      }
    )
  }

  const columns: DataTableColumn<Scheme>[] = [
    {
      key: 'schemeName',
      header: t('schemeSync.table.schemeName'),
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
      key: 'fhtcCount',
      header: t('schemeSync.table.fhtcCount'),
      sortable: false,
      width: '17%',
      minWidth: '120px',
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
      width: '17%',
      minWidth: '140px',
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
      width: '18%',
      minWidth: '120px',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400" overflow="hidden" textOverflow="ellipsis">
          {row.workStatus}
        </Text>
      ),
    },
    {
      key: 'operatingStatus',
      header: t('schemeSync.table.operatingStatus'),
      sortable: false,
      width: '18%',
      minWidth: '140px',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400" overflow="hidden" textOverflow="ellipsis">
          {row.operatingStatus}
        </Text>
      ),
    },
  ]

  if (isError) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('schemeSync.title')}
        </Heading>
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
      {/* Page Header */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('schemeSync.title')}
        </Heading>
      </Box>

      {/* Toolbar: search + filters + upload */}
      <Flex
        as="section"
        aria-label={t('schemeSync.aria.filterSection')}
        justify="space-between"
        align="center"
        mb={6}
        py={3}
        px={{ base: 3, md: 6 }}
        h={{ base: 'auto', md: 16 }}
        gap={{ base: 3, md: 4 }}
        flexDirection={{ base: 'column', md: 'row' }}
        flexWrap="wrap"
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
            placeholder={t('schemeSync.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t('schemeSync.aria.searchSchemes')}
            bg="white"
            h={8}
            borderWidth="1px"
            borderRadius="4px"
            borderColor="neutral.300"
            _placeholder={{ color: 'neutral.300' }}
          />
        </InputGroup>

        {/* Middle: filters */}
        <Flex align="center" gap={3} flex={1} flexWrap="wrap">
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

        {/* Right: upload */}
        <Button
          variant="secondary"
          size="sm"
          fontWeight="600"
          gap={1}
          flexShrink={0}
          aria-label={t('schemeSync.aria.uploadData')}
          leftIcon={<FiUpload aria-hidden="true" />}
          onClick={() => setIsUploadOpen(true)}
        >
          {t('schemeSync.uploadData')}
        </Button>
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
          icon={MdOutlineListAlt}
          iconBg="#EBF4FA"
          iconColor="#3291D1"
          height="172px"
        />
        <StatCard
          title={t('schemeSync.stats.activeSchemes')}
          value={countsLoading ? '—' : (counts?.activeSchemes ?? 0)}
          icon={MdOutlineListAlt}
          iconBg="#E6F9F0"
          iconColor="#27AE60"
          height="172px"
        />
        <StatCard
          title={t('schemeSync.stats.inactiveSchemes')}
          value={countsLoading ? '—' : (counts?.inactiveSchemes ?? 0)}
          icon={MdOutlineListAlt}
          iconBg="#FEF3F2"
          iconColor="#D94B3E"
          height="172px"
        />
      </SimpleGrid>

      {/* Data Table */}
      <DataTable<Scheme>
        columns={columns}
        data={displayedSchemes}
        getRowKey={(row) => row.id}
        emptyMessage={t('schemeSync.messages.noSchemesFound')}
        isLoading={isLoading}
        tableLayout="fixed"
        tableMinWidth="900px"
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

      <UploadFileModal
        isOpen={isUploadOpen}
        onClose={() => {
          setUploadValidationErrors([])
          setIsUploadOpen(false)
        }}
        title={t('schemeSync.upload.title')}
        description={t('schemeSync.upload.description')}
        isPending={isUploading}
        onSubmit={handleUpload}
        submitLabel={t('schemeSync.upload.submit')}
        selectFileLabel={t('schemeSync.upload.clickToSelect')}
        fileTypesLabel={t('schemeSync.upload.fileTypes')}
        closeAriaLabel={t('schemeSync.upload.close')}
        cancelLabel={t('schemeSync.upload.cancel')}
        validationErrors={uploadValidationErrors}
      />

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
