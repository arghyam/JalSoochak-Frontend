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
import { FiFilter, FiUpload, FiDownload } from 'react-icons/fi'
import { BsPerson } from 'react-icons/bs'
import { DataTable, SearchableSelect, StatCard, StatusChip } from '@/shared/components/common'
import type { DataTableColumn } from '@/shared/components/common'
import type { StaffMember } from '../../types/staff-sync'
import { useStaffSyncQuery } from '../../services/query/use-state-admin-queries'

const ROLE_DISPLAY: Record<string, string> = {
  'pump-operator': 'Pump Operator',
  'sub-division-officer': 'Sub-Division Officer',
  'section-officer': 'Section Officer',
}

export function StaffSyncPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { data, isLoading, isError, refetch } = useStaffSyncQuery()

  const [searchQuery, setSearchQuery] = useState('')
  const [gpFilter, setGpFilter] = useState('')
  const [villageFilter, setVillageFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    document.title = `${t('staffSync.title')} | JalSoochak`
  }, [t])

  const formatLastSubmission = (value: string | null): string => {
    if (!value) return t('staffSync.messages.naSubmission')
    const date = new Date(value)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'pm' : 'am'
    hours = hours % 12
    hours = hours ? hours : 12
    return `${month}-${day}-${year}, ${hours}:${minutes}${ampm}`
  }

  const handleGpChange = (value: string) => {
    setGpFilter(value)
    setVillageFilter('')
  }

  const handleClearFilters = () => {
    setGpFilter('')
    setVillageFilter('')
    setRoleFilter('')
    setStatusFilter('')
  }

  const hasActiveFilters = gpFilter || villageFilter || roleFilter || statusFilter

  // Derive village options based on selected GP
  const villageOptions = useMemo(() => {
    if (!data) return []
    if (!gpFilter) {
      return data.gramPanchayats.flatMap((gp) => gp.villages)
    }
    return data.gramPanchayats.find((gp) => gp.value === gpFilter)?.villages ?? []
  }, [data, gpFilter])

  const gpOptions = useMemo(() => data?.gramPanchayats ?? [], [data])

  const roleOptions = useMemo(
    () => [
      { value: 'pump-operator', label: t('staffSync.roles.pumpOperator') },
      { value: 'sub-division-officer', label: t('staffSync.roles.subDivisionOfficer') },
      { value: 'section-officer', label: t('staffSync.roles.sectionOfficer') },
    ],
    [t]
  )

  const statusOptions = useMemo(
    () => [
      { value: 'active', label: t('common:status.active') },
      { value: 'inactive', label: t('common:status.inactive') },
    ],
    [t]
  )

  const filteredStaff = useMemo(() => {
    if (!data) return []
    return data.staff.filter((member) => {
      const matchesSearch =
        !searchQuery || member.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGP = !gpFilter || member.gramPanchayat === gpFilter
      const matchesVillage = !villageFilter || member.village === villageFilter
      const matchesRole = !roleFilter || member.role === roleFilter
      const matchesStatus = !statusFilter || member.activityStatus === statusFilter
      return matchesSearch && matchesGP && matchesVillage && matchesRole && matchesStatus
    })
  }, [data, searchQuery, gpFilter, villageFilter, roleFilter, statusFilter])

  const columns: DataTableColumn<StaffMember>[] = [
    {
      key: 'gramPanchayat',
      header: t('staffSync.table.allGpVillage'),
      sortable: true,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.gramPanchayat}
        </Text>
      ),
    },
    {
      key: 'name',
      header: t('staffSync.table.name'),
      sortable: true,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.name}
        </Text>
      ),
    },
    {
      key: 'role',
      header: t('staffSync.table.role'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {ROLE_DISPLAY[row.role] ?? row.role}
        </Text>
      ),
    },
    {
      key: 'mobileNumber',
      header: t('staffSync.table.mobileNumber'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.mobileNumber}
        </Text>
      ),
    },
    {
      key: 'lastSubmission',
      header: t('staffSync.table.lastSubmission'),
      sortable: true,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {formatLastSubmission(row.lastSubmission)}
        </Text>
      ),
    },
    {
      key: 'activityStatus',
      header: t('staffSync.table.activityStatus'),
      sortable: false,
      render: (row) => (
        <StatusChip
          status={row.activityStatus as string}
          label={
            row.activityStatus === 'active'
              ? t('common:status.active')
              : t('common:status.inactive')
          }
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

      {/* Search and Action Buttons */}
      <Flex
        justify="space-between"
        align="center"
        mb={4}
        h={{ base: 'auto', md: 16 }}
        py={4}
        px={{ base: 3, md: 6 }}
        gap={{ base: 3, md: 4 }}
        flexDirection={{ base: 'column', md: 'row' }}
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        bg="white"
      >
        <InputGroup w={{ base: 'full', md: '320px' }}>
          <InputLeftElement pointerEvents="none" h={8}>
            <SearchIcon color="neutral.300" aria-hidden="true" />
          </InputLeftElement>
          <Input
            placeholder={t('staffSync.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t('staffSync.aria.searchStaff')}
            bg="white"
            h={8}
            borderWidth="1px"
            borderRadius="4px"
            borderColor="neutral.300"
            _placeholder={{ color: 'neutral.300' }}
          />
        </InputGroup>

        <Flex
          gap={3}
          w={{ base: 'full', md: 'auto' }}
          flexDirection={{ base: 'column', sm: 'row' }}
        >
          <Button
            variant="secondary"
            size="sm"
            fontWeight="600"
            gap={1}
            w={{ base: 'full', sm: 'auto' }}
            aria-label={t('staffSync.aria.uploadData')}
            leftIcon={<FiUpload aria-hidden="true" />}
          >
            {t('staffSync.uploadData')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fontWeight="600"
            gap={1}
            w={{ base: 'full', sm: 'auto' }}
            aria-label={t('staffSync.aria.downloadData')}
            leftIcon={<FiDownload aria-hidden="true" />}
          >
            {t('staffSync.downloadData')}
          </Button>
        </Flex>
      </Flex>

      {/* Filters Row */}
      <Flex
        as="section"
        aria-label={t('staffSync.aria.filterSection')}
        align="center"
        mb={6}
        py={3}
        px={{ base: 3, md: 6 }}
        height={16}
        gap={3}
        flexWrap="wrap"
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        bg="white"
      >
        <Flex align="center" gap={1} color="neutral.600" flexShrink={0}>
          <FiFilter aria-hidden="true" size={16} />
          <Text fontSize="sm" fontWeight="500">
            {t('staffSync.filters.label')}
          </Text>
        </Flex>

        <SearchableSelect
          options={gpOptions}
          value={gpFilter}
          onChange={handleGpChange}
          placeholder={t('staffSync.filters.gramPanchayat')}
          width="160px"
          height="32px"
          borderRadius="4px"
          fontSize="sm"
          isFilter
          ariaLabel={t('staffSync.filters.gramPanchayat')}
        />

        <SearchableSelect
          options={villageOptions}
          value={villageFilter}
          onChange={setVillageFilter}
          placeholder={t('staffSync.filters.village')}
          width="140px"
          height="32px"
          borderRadius="4px"
          fontSize="sm"
          isFilter
          disabled={!gpFilter}
          ariaLabel={t('staffSync.filters.village')}
        />

        <SearchableSelect
          options={roleOptions}
          value={roleFilter}
          onChange={setRoleFilter}
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
          onChange={setStatusFilter}
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
          value={data?.stats.totalPumpOperators ?? 0}
          icon={BsPerson}
          iconBg="#EBF4FA"
          iconColor="#3291D1"
          height="172px"
        />
        <StatCard
          title={t('staffSync.stats.totalSubDivisionOfficers')}
          value={data?.stats.totalSubDivisionOfficers ?? 0}
          icon={BsPerson}
          iconBg="#F1EEFF"
          iconColor="#584C93"
          height="172px"
        />
        <StatCard
          title={t('staffSync.stats.totalSectionOfficers')}
          value={data?.stats.totalSectionOfficers ?? 0}
          icon={BsPerson}
          iconBg="#FBEAFF"
          iconColor="#DC72F2"
          height="172px"
        />
      </SimpleGrid>

      {/* Data Table */}
      <DataTable<StaffMember>
        columns={columns}
        data={filteredStaff}
        getRowKey={(row) => row.id}
        emptyMessage={t('staffSync.messages.noStaffFound')}
        isLoading={isLoading}
        pagination={{
          enabled: true,
          pageSize: 10,
          pageSizeOptions: [10, 25, 50],
        }}
      />
    </Box>
  )
}
