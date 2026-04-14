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
  Button,
  IconButton,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { SearchIcon, EditIcon } from '@chakra-ui/icons'
import { FiEye } from 'react-icons/fi'
import { IoAddOutline } from 'react-icons/io5'
import {
  ActionTooltip,
  DataTable,
  type DataTableColumn,
  SearchableSelect,
  StatusChip,
  PageHeader,
} from '@/shared/components/common'
import type { Tenant, TenantStatus } from '../../types/states-uts'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { ROUTES } from '@/shared/constants/routes'
import { useStatesUTsPagedQuery } from '../../services/query/use-super-admin-queries'

function tenantStatusChipKey(status: TenantStatus): string {
  return status.toLowerCase()
}

const TENANT_FILTER_STATUSES = [
  'ONBOARDED',
  'CONFIGURED',
  'ACTIVE',
  'INACTIVE',
  'DEGRADED',
  'SUSPENDED',
  'ARCHIVED',
] as const

type TenantFilterStatus = (typeof TENANT_FILTER_STATUSES)[number] | 'all'

export function StatesUTsPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TenantFilterStatus>('all')
  const debouncedSearch = useDebounce(searchQuery, 400)

  const { data, isLoading, isError, refetch } = useStatesUTsPagedQuery(
    page,
    pageSize,
    debouncedSearch,
    statusFilter
  )

  useEffect(() => {
    document.title = `${t('statesUts.title')} | JalSoochak`
  }, [t])

  if (isError) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('statesUts.title')}
          </Heading>
        </PageHeader>
        <Flex h="64" align="center" justify="center" direction="column" gap={4} role="alert">
          <Text color="error.500">{t('common:toast.failedToLoad')}</Text>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            {t('common:retry')}
          </Button>
        </Flex>
      </Box>
    )
  }

  const handleView = (stateCode: string) => {
    navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':tenantCode', stateCode))
  }

  const handleEdit = (stateCode: string) => {
    navigate(ROUTES.SUPER_ADMIN_STATES_UTS_EDIT.replace(':tenantCode', stateCode))
  }

  const statusOptions = [
    { value: 'all', label: t('statesUts.filters.allStatuses') },
    ...TENANT_FILTER_STATUSES.map((s) => ({
      value: s,
      label: t(`statesUts.statusSection.statuses.${s}`),
    })),
  ]

  const columns: DataTableColumn<Tenant>[] = [
    {
      key: 'name',
      header: t('statesUts.table.stateUt'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.name}
        </Text>
      ),
    },
    {
      key: 'stateCode',
      header: t('statesUts.table.stateCode'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.stateCode}
        </Text>
      ),
    },
    {
      key: 'lgdCode',
      header: t('statesUts.table.lgdCode'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.lgdCode}
        </Text>
      ),
    },
    {
      key: 'status',
      header: t('statesUts.table.status'),
      sortable: false,
      render: (row) => (
        <StatusChip
          status={tenantStatusChipKey(row.status)}
          label={t(`statesUts.statusSection.statuses.${row.status}`)}
        />
      ),
    },
    {
      key: 'actions',
      header: t('statesUts.table.actions'),
      render: (row) => (
        <Flex gap={1}>
          <ActionTooltip label={t('statesUts.aria.viewStateUt')}>
            <IconButton
              aria-label={`${t('statesUts.aria.viewStateUt')} ${row.name}`}
              icon={<FiEye aria-hidden="true" size={20} />}
              variant="ghost"
              width={5}
              minW={5}
              height={5}
              color="neutral.950"
              onClick={() => handleView(row.stateCode)}
              _hover={{ color: 'primary.500', bg: 'transparent' }}
            />
          </ActionTooltip>
          <ActionTooltip label={t('statesUts.aria.editStateUt')}>
            <IconButton
              aria-label={`${t('statesUts.aria.editStateUt')} ${row.name}`}
              icon={<EditIcon aria-hidden="true" w={5} h={5} />}
              variant="ghost"
              width={5}
              minW={5}
              height={5}
              color="neutral.950"
              onClick={() => handleEdit(row.stateCode)}
              _hover={{ color: 'primary.500', bg: 'transparent' }}
            />
          </ActionTooltip>
        </Flex>
      ),
    },
  ]

  return (
    <Box w="full" maxW="100%" minW={0}>
      <PageHeader>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('statesUts.title')}
        </Heading>
      </PageHeader>

      <Flex
        justify="space-between"
        align="center"
        mb={6}
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
        <Flex
          gap={3}
          w={{ base: 'full', md: 'auto' }}
          flexDirection={{ base: 'column', sm: 'row' }}
        >
          <InputGroup w={{ base: 'full', md: '240px', lg: '320px' }}>
            <InputLeftElement pointerEvents="none" h={8}>
              <SearchIcon color="neutral.300" aria-hidden="true" />
            </InputLeftElement>
            <Input
              placeholder={t('statesUts.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              aria-label={t('statesUts.searchPlaceholder')}
              bg="white"
              h={8}
              borderWidth="1px"
              borderRadius="4px"
              borderColor="neutral.300"
              _placeholder={{ color: 'neutral.300' }}
            />
          </InputGroup>
          <SearchableSelect
            options={statusOptions}
            value={statusFilter}
            height="32px"
            onChange={(val) => {
              setStatusFilter(val as TenantFilterStatus)
              setPage(1)
            }}
            placeholder={t('statesUts.filters.allStatuses')}
            width={{ base: '100%', md: '140px' }}
            isFilter
          />
        </Flex>
        <Button
          variant="secondary"
          size="sm"
          fontWeight="600"
          onClick={() => navigate(ROUTES.SUPER_ADMIN_STATES_UTS_ADD)}
          gap={1}
          w={{ base: 'full', md: '178px' }}
          aria-label={t('statesUts.addNewStateUt')}
        >
          <IoAddOutline size={24} aria-hidden="true" />
          {t('statesUts.addNewStateUt')}
        </Button>
      </Flex>

      <DataTable<Tenant>
        columns={columns}
        data={data?.items ?? []}
        getRowKey={(row) => String(row.id)}
        emptyMessage={t('statesUts.messages.noStatesFound')}
        isLoading={isLoading}
        pagination={{
          enabled: true,
          page,
          pageSize,
          totalItems: data?.total,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size)
            setPage(1)
          },
          pageSizeOptions: [10, 25, 50],
        }}
      />
    </Box>
  )
}
