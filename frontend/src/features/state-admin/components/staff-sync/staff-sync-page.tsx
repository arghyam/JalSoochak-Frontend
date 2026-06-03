import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  SimpleGrid,
  Text,
} from '@chakra-ui/react'
import { SearchIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import { FiDownload, FiUpload } from 'react-icons/fi'
import { TbBroadcast } from 'react-icons/tb'
import { TotalStaffIcon, PumpOperatorIcon, TotalAdminsIcon } from '../overview/overview-icons'
import {
  DataTable,
  SearchableSelect,
  StatCard,
  PageHeader,
  ToastContainer,
  TruncatedCell,
} from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import type { DataTableColumn } from '@/shared/components/common'
import type { StaffMember, StaffRole, StaffStatus } from '../../types/staff-sync'
import {
  useStaffListQuery,
  useStaffCountsQuery,
  useGenerateStaffReportMutation,
} from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/shared/constants/pagination'
import { UploadStaffModal } from './upload-staff-modal'
import { BroadcastModal } from './broadcast-modal'
import { StaffActivityToggle } from './staff-activity-toggle'

const DEFAULT_ROLES: StaffRole[] = ['PUMP_OPERATOR', 'SECTION_OFFICER', 'SUB_DIVISIONAL_OFFICER']
export const DEBOUNCE_DELAY_MS = 400

const ROLE_DISPLAY: Record<StaffRole, string> = {
  PUMP_OPERATOR: 'Pump Operator',
  SECTION_OFFICER: 'Section Officer',
  SUB_DIVISIONAL_OFFICER: 'Sub Divisional Officer',
}

export function StaffSyncPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const toast = useToast()
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<StaffRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<StaffStatus | ''>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_DELAY_MS)

  useEffect(() => {
    document.title = `${t('staffSync.title')} | JalSoochak`
  }, [t])

  // Short-circuit: if the raw input is already empty, send no name filter immediately
  // rather than waiting for the debounce to settle on the previous term.
  const nameParam = searchQuery === '' ? '' : debouncedSearch

  const staffParams = useMemo(
    () => ({
      roles: roleFilter ? [roleFilter] : DEFAULT_ROLES,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(nameParam ? { name: nameParam } : {}),
      page: page - 1,
      limit: pageSize,
      tenantCode,
    }),
    [roleFilter, statusFilter, nameParam, page, pageSize, tenantCode]
  )

  const { data, isLoading, isError, refetch } = useStaffListQuery(staffParams)
  const { data: counts, isLoading: countsLoading } = useStaffCountsQuery()
  const { mutate: generateReport, isPending: isReportPending } = useGenerateStaffReportMutation()

  const handleReport = () => {
    generateReport(
      {
        roles: roleFilter ? [roleFilter] : DEFAULT_ROLES,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      {
        onSuccess: async ({ downloadUrl }) => {
          // fetch → Blob URL so the download attribute is honoured on cross-origin URLs
          try {
            const res = await fetch(downloadUrl, { signal: AbortSignal.timeout(30_000) })
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
            const ts = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15)
            a.download = `staff-report_${ts}.csv`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(blobUrl)
            toast.success(t('staffSync.report.success'))
          } catch {
            toast.error(t('staffSync.report.error'))
          }
        },
        onError: () => toast.error(t('staffSync.report.error')),
      }
    )
  }

  const roleOptions = [
    { value: 'PUMP_OPERATOR', label: t('staffSync.roles.pumpOperator') },
    { value: 'SUB_DIVISIONAL_OFFICER', label: t('staffSync.roles.subDivisionOfficer') },
    { value: 'SECTION_OFFICER', label: t('staffSync.roles.sectionOfficer') },
  ]

  const statusOptions = [
    { value: 'ACTIVE', label: t('common:status.active') },
    { value: 'INACTIVE', label: t('common:status.inactive') },
  ]

  const hasActiveFilters = roleFilter || statusFilter || searchQuery

  const handleRoleChange = (value: string) => {
    setRoleFilter(value as StaffRole | '')
    setPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as StaffStatus | '')
    setPage(1)
  }

  const handleClearFilters = () => {
    setRoleFilter('')
    setStatusFilter('')
    setSearchQuery('')
    setPage(1)
  }

  const columns: DataTableColumn<StaffMember>[] = [
    {
      key: 'title',
      header: t('staffSync.table.name'),
      sortable: false,
      width: '25%',
      minWidth: '200px',
      headerMaxLines: 2,
      render: (row) => <TruncatedCell value={row.title} />,
    },
    {
      key: 'role',
      header: t('staffSync.table.role'),
      sortable: false,
      width: '20%',
      minWidth: '200px',
      headerMaxLines: 2,
      render: (row) => <TruncatedCell value={ROLE_DISPLAY[row.role] ?? row.role} />,
    },
    {
      key: 'phoneNumber',
      header: t('staffSync.table.mobileNumber'),
      sortable: false,
      width: '20%',
      minWidth: '200px',
      headerMaxLines: 2,
      render: (row) => <TruncatedCell value={row.phoneNumber} />,
    },
    {
      key: 'schemes',
      header: t('staffSync.table.schemes'),
      sortable: false,
      width: '25%',
      minWidth: '200px',
      headerMaxLines: 2,
      render: (row) => {
        if (!row.schemes.length) {
          return (
            <Text textStyle="h10" fontWeight="400" color="neutral.400">
              —
            </Text>
          )
        }
        const first = row.schemes[0].schemeName
        if (row.schemes.length === 1) {
          return <TruncatedCell value={first} />
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
              >
                {first}{' '}
                <Text as="span" color="primary.500" fontWeight="500">
                  +{row.schemes.length - 1}
                </Text>
              </Text>
            </PopoverTrigger>
            <PopoverContent w="auto" minW="200px" maxW="320px" boxShadow="md">
              <PopoverBody maxH="250px" overflowY="auto" p={2}>
                {row.schemes.map((s) => (
                  <Text key={s.schemeId} textStyle="h10" py={1} px={1}>
                    {s.schemeName}
                  </Text>
                ))}
              </PopoverBody>
            </PopoverContent>
          </Popover>
        )
      },
    },
    {
      key: 'status',
      header: t('staffSync.table.activityStatus'),
      sortable: false,
      width: '10%',
      minWidth: '200px',
      headerMaxLines: 2,
      render: (row) => (
        <StaffActivityToggle
          staffId={row.id}
          status={row.status}
          tenantCode={tenantCode}
          onSuccess={toast.success}
          onError={toast.error}
        />
      ),
    },
  ]

  if (isError) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('staffSync.title')}
          </Heading>
        </PageHeader>
        <Flex h="64" align="center" justify="center" direction="column" gap={4} role="alert">
          <Text color="error.500">{t('staffSync.messages.failedToLoad')}</Text>
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
          {t('staffSync.title')}
        </Heading>
      </PageHeader>

      {/* Toolbar: search + filters + upload */}
      <Flex
        as="section"
        aria-label={t('staffSync.aria.filterSection')}
        justify="space-between"
        align="flex-start"
        mb={6}
        py={3}
        px={{ base: 3, md: 6 }}
        gap={{ base: 3, md: 4 }}
        flexDirection={{ base: 'column', xl: 'row' }}
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
              placeholder={t('staffSync.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              aria-label={t('staffSync.aria.searchStaff')}
              bg="white"
              h={8}
              borderWidth="1px"
              borderRadius="4px"
              borderColor="neutral.300"
              _placeholder={{ color: 'neutral.300' }}
            />
          </InputGroup>

          <SearchableSelect
            options={roleOptions}
            value={roleFilter}
            onChange={handleRoleChange}
            placeholder={t('staffSync.filters.role')}
            width="180px"
            height="32px"
            borderRadius="4px"
            fontSize="sm"
            isFilter
            ariaLabel={t('staffSync.filters.role')}
            searchable={false}
          />

          <SearchableSelect
            options={statusOptions}
            value={statusFilter}
            onChange={handleStatusChange}
            placeholder={t('staffSync.filters.status')}
            width="130px"
            height="32px"
            borderRadius="4px"
            fontSize="sm"
            isFilter
            ariaLabel={t('staffSync.filters.status')}
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
              {t('staffSync.filters.clearAll')}
            </Button>
          )}
        </Flex>

        {/* Right: reports + broadcast + upload */}
        <Flex
          gap={2}
          flexShrink={0}
          w={{ base: 'full', xl: 'auto' }}
          flexDirection={{ base: 'column', sm: 'row' }}
        >
          <Button
            variant="secondary"
            size="sm"
            fontWeight="600"
            w={{ base: 'full', sm: 'auto' }}
            aria-label={t('staffSync.report.aria.download')}
            onClick={handleReport}
            isLoading={isReportPending}
            loadingText={t('staffSync.report.button')}
          >
            <FiDownload
              aria-hidden="true"
              size={16}
              style={{ marginRight: '4px', flexShrink: 0 }}
            />
            {t('staffSync.report.button')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fontWeight="600"
            w={{ base: 'full', sm: 'auto' }}
            aria-label={t('staffSync.broadcast.aria.broadcast')}
            onClick={() => setIsBroadcastOpen(true)}
          >
            <TbBroadcast
              aria-hidden="true"
              size={16}
              style={{ marginRight: '4px', flexShrink: 0 }}
            />
            {t('staffSync.broadcast.button')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fontWeight="600"
            w={{ base: 'full', sm: 'auto' }}
            aria-label={t('staffSync.aria.uploadData')}
            onClick={() => setIsUploadOpen(true)}
          >
            <FiUpload aria-hidden="true" size={16} style={{ marginRight: '4px', flexShrink: 0 }} />
            {t('staffSync.uploadData')}
          </Button>
        </Flex>
      </Flex>

      {/* Stats Cards */}
      <SimpleGrid
        as="section"
        aria-label={t('staffSync.aria.statsSection')}
        columns={{ base: 1, sm: 3 }}
        spacing={{ base: 4, md: 6 }}
        mb={6}
      >
        <StatCard
          title={t('staffSync.stats.totalPumpOperators')}
          value={countsLoading ? '—' : (counts?.pumpOperators ?? 0)}
          icon={TotalStaffIcon}
          iconBg="#EBF4FA"
          iconColor="#3291D1"
        />
        <StatCard
          title={t('staffSync.stats.totalSubDivisionOfficers')}
          value={countsLoading ? '—' : (counts?.subDivisionOfficers ?? 0)}
          icon={PumpOperatorIcon}
          iconBg="#F1EEFF"
          iconColor="#584C93"
        />
        <StatCard
          title={t('staffSync.stats.totalSectionOfficers')}
          value={countsLoading ? '—' : (counts?.sectionOfficers ?? 0)}
          icon={TotalAdminsIcon}
          iconBg="#FBEAFF"
          iconColor="#DC72F2"
        />
      </SimpleGrid>

      {/* Data Table */}
      <DataTable<StaffMember>
        columns={columns}
        data={data?.items ?? []}
        getRowKey={(row) => row.id}
        emptyMessage={t('staffSync.messages.noStaffFound')}
        isLoading={isLoading}
        tableLayout="fixed"
        tableMinWidth="1000px"
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

      <UploadStaffModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <BroadcastModal isOpen={isBroadcastOpen} onClose={() => setIsBroadcastOpen(false)} />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
