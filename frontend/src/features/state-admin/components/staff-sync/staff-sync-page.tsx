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
import { FiUpload } from 'react-icons/fi'
import { TotalStaffIcon, PumpOperatorIcon, TotalAdminsIcon } from '../overview/overview-icons'
import { DataTable, SearchableSelect, StatCard, StatusChip } from '@/shared/components/common'
import type { DataTableColumn } from '@/shared/components/common'
import type { StaffMember, StaffRole, StaffStatus } from '../../types/staff-sync'
import {
  useStaffListQuery,
  useStaffCountsQuery,
} from '../../services/query/use-state-admin-queries'
import { useAuthStore } from '@/app/store/auth-store'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { UploadStaffModal } from './upload-staff-modal'

const DEFAULT_ROLES: StaffRole[] = ['PUMP_OPERATOR', 'SECTION_OFFICER', 'SUB_DIVISIONAL_OFFICER']
const PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [10, 25, 50]
export const DEBOUNCE_DELAY_MS = 400

const ROLE_DISPLAY: Record<StaffRole, string> = {
  PUMP_OPERATOR: 'Pump Operator',
  SECTION_OFFICER: 'Section Officer',
  SUB_DIVISIONAL_OFFICER: 'Sub Divisional Officer',
}

export function StaffSyncPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const tenantCode = useAuthStore((s) => s.user?.tenantCode ?? '')

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<StaffRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<StaffStatus | ''>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
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

  const roleOptions = useMemo(
    () => [
      { value: 'PUMP_OPERATOR', label: t('staffSync.roles.pumpOperator') },
      { value: 'SUB_DIVISIONAL_OFFICER', label: t('staffSync.roles.subDivisionOfficer') },
      { value: 'SECTION_OFFICER', label: t('staffSync.roles.sectionOfficer') },
    ],
    [t]
  )

  const statusOptions = useMemo(
    () => [
      { value: 'ACTIVE', label: t('common:status.active') },
      { value: 'INACTIVE', label: t('common:status.inactive') },
    ],
    [t]
  )

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
      width: '20%',
      minWidth: '200px',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400" overflow="hidden" textOverflow="ellipsis">
          {row.title}
        </Text>
      ),
    },
    {
      key: 'role',
      header: t('staffSync.table.role'),
      sortable: false,
      width: '20%',
      minWidth: '200px',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400" overflow="hidden" textOverflow="ellipsis">
          {ROLE_DISPLAY[row.role] ?? row.role}
        </Text>
      ),
    },
    {
      key: 'phoneNumber',
      header: t('staffSync.table.mobileNumber'),
      sortable: false,
      width: '20%',
      minWidth: '200px',
      render: (row) => (
        <Text textStyle="h10" fontWeight="400" overflow="hidden" textOverflow="ellipsis">
          {row.phoneNumber}
        </Text>
      ),
    },
    {
      key: 'schemes',
      header: t('staffSync.table.schemes'),
      sortable: false,
      width: '20%',
      minWidth: '200px',
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
          return (
            <Text textStyle="h10" fontWeight="400" overflow="hidden" textOverflow="ellipsis">
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
      width: '20%',
      minWidth: '200px',
      render: (row) => (
        <StatusChip
          status={row.status === 'ACTIVE' ? 'active' : 'inactive'}
          label={row.status === 'ACTIVE' ? t('common:status.active') : t('common:status.inactive')}
        />
      ),
    },
  ]

  if (isError) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('staffSync.title')}
        </Heading>
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
      {/* Page Header */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('staffSync.title')}
        </Heading>
      </Box>

      {/* Toolbar: search + filters + upload */}
      <Flex
        as="section"
        aria-label={t('staffSync.aria.filterSection')}
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

        {/* Middle: filters */}
        <Flex align="center" gap={3} flex={1} flexWrap="wrap">
          {/* <Flex align="center" gap={1} color="neutral.600" flexShrink={0}>
            <FiFilter aria-hidden="true" size={16} />
            <Text fontSize="sm" fontWeight="500">
              {t('staffSync.filters.label')}
            </Text>
          </Flex> */}

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

        {/* Right: upload */}
        <Button
          variant="secondary"
          size="sm"
          fontWeight="600"
          width="147px"
          flexShrink={0}
          aria-label={t('staffSync.aria.uploadData')}
          onClick={() => setIsUploadOpen(true)}
        >
          <FiUpload aria-hidden="true" size={16} style={{ marginRight: '4px', flexShrink: 0 }} />
          {t('staffSync.uploadData')}
        </Button>
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
    </Box>
  )
}
