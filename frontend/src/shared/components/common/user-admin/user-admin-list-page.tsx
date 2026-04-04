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
  Spinner,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { SearchIcon, EditIcon } from '@chakra-ui/icons'
import { FiEye } from 'react-icons/fi'
import { IoAddOutline } from 'react-icons/io5'
import { MdOutlineEmail } from 'react-icons/md'
import { ActionTooltip } from '../action-tooltip'
import { DataTable, type DataTableColumn } from '../data-table'
import { StatusChip } from '../atom/status-chip'
import { SearchableSelect } from '../searchable-select'
import type { UserAdminData, UserAdminRoutes, UserAdminListLabels } from './types'
import { PageHeader } from '../page-header'

type StatusFilter = 'all' | 'active' | 'inactive' | 'pending'

export interface UserAdminListPageProps {
  readonly data: UserAdminData[]
  readonly isLoading: boolean
  readonly isError: boolean
  readonly onRefetch: () => void
  readonly routes: UserAdminRoutes
  readonly labels: UserAdminListLabels
  readonly onReinvite?: (id: string) => void
  /** Optional server-side pagination controls. When omitted, pagination is client-side. */
  readonly page?: number
  readonly pageSize?: number
  readonly totalItems?: number
  readonly onPageChange?: (page: number) => void
  readonly onPageSizeChange?: (pageSize: number) => void
  /** When true, the search input is hidden. */
  readonly hideSearch?: boolean
  /** Controlled search value (server-side mode). When provided, client-side search is skipped. */
  readonly searchQuery?: string
  /** Controlled search change callback (server-side mode). */
  readonly onSearchChange?: (value: string) => void
  /** Controlled status filter value (server-side mode). When provided, client-side status filtering is skipped. */
  readonly statusFilter?: StatusFilter
  /** Controlled status filter change callback (server-side mode). */
  readonly onStatusFilterChange?: (value: StatusFilter) => void
}

export function UserAdminListPage({
  data,
  isLoading,
  isError,
  onRefetch,
  routes,
  labels,
  onReinvite,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  hideSearch,
  searchQuery: controlledSearch,
  onSearchChange,
  statusFilter: controlledStatus,
  onStatusFilterChange,
}: UserAdminListPageProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  // In server-side mode a controlled value without its callback means the
  // control would appear interactive but silently do nothing — hide it instead.
  const showSearch = !hideSearch && (controlledSearch === undefined || !!onSearchChange)
  const showStatusFilter = controlledStatus === undefined || !!onStatusFilterChange

  const searchQuery = controlledSearch ?? ''
  const setSearchQuery = onSearchChange ?? (() => {})

  const statusFilter = controlledStatus ?? 'all'
  const setStatusFilter = onStatusFilterChange ?? (() => {})

  if (isLoading) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {labels.pageTitle}
          </Heading>
        </PageHeader>
        <Flex role="status" aria-live="polite" align="center" minH="200px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">{t('loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (isError) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {labels.pageTitle}
          </Heading>
        </PageHeader>
        <Flex h="64" align="center" justify="center" direction="column" gap={4} role="alert">
          <Text color="error.500">{t('toast.failedToLoad')}</Text>
          <Button variant="secondary" size="sm" onClick={onRefetch}>
            {t('retry')}
          </Button>
        </Flex>
      </Box>
    )
  }

  const statusOptions = [
    { value: 'all', label: labels.allStatuses },
    { value: 'active', label: t('status.active') },
    { value: 'inactive', label: t('status.inactive') },
    { value: 'pending', label: t('status.pending') },
  ]

  const handleView = (id: string) => {
    navigate(routes.view(id))
  }

  const handleEdit = (id: string) => {
    navigate(routes.edit(id))
  }

  const columns: DataTableColumn<UserAdminData>[] = [
    {
      key: 'firstName',
      header: labels.table.name,
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.firstName} {row.lastName}
        </Text>
      ),
    },
    {
      key: 'phone',
      header: labels.table.mobileNumber,
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          +91 {row.phone.replace(/(\d{5})(\d{5})/, '$1-$2')}
        </Text>
      ),
    },
    {
      key: 'email',
      header: labels.table.emailAddress,
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.email}
        </Text>
      ),
    },
    {
      key: 'status',
      header: labels.table.status,
      sortable: false,
      render: (row) => {
        let statusLabel: string
        if (row.status === 'active') {
          statusLabel = t('status.active')
        } else if (row.status === 'pending') {
          statusLabel = t('status.pending')
        } else {
          statusLabel = t('status.inactive')
        }
        return <StatusChip status={row.status} label={statusLabel} />
      },
    },
    {
      key: 'id',
      header: labels.table.actions,
      render: (row) => (
        <Flex gap={1}>
          <ActionTooltip label={labels.aria.view}>
            <IconButton
              aria-label={`${labels.aria.view} ${row.firstName} ${row.lastName}`}
              icon={<FiEye aria-hidden="true" size={20} />}
              variant="ghost"
              width={5}
              minW={5}
              height={5}
              color="neutral.950"
              fontWeight="400"
              onClick={() => handleView(row.id)}
              _hover={{ color: 'primary.500', bg: 'transparent' }}
            />
          </ActionTooltip>
          <ActionTooltip label={labels.aria.edit}>
            <IconButton
              aria-label={`${labels.aria.edit} ${row.firstName} ${row.lastName}`}
              icon={<EditIcon aria-hidden="true" w={5} h={5} />}
              variant="ghost"
              width={5}
              minW={5}
              height={5}
              color="neutral.950"
              fontWeight="400"
              onClick={() => handleEdit(row.id)}
              _hover={{ color: 'primary.500', bg: 'transparent' }}
            />
          </ActionTooltip>
          {row.status === 'pending' && onReinvite && (
            <ActionTooltip label={labels.aria.resendInvite}>
              <IconButton
                aria-label={`${labels.aria.resendInvite} ${row.firstName} ${row.lastName}`}
                icon={<MdOutlineEmail aria-hidden="true" size={20} />}
                variant="ghost"
                width={5}
                minW={5}
                height={5}
                color="neutral.950"
                fontWeight="400"
                onClick={() => onReinvite(row.id)}
                _hover={{ color: 'primary.500', bg: 'transparent' }}
              />
            </ActionTooltip>
          )}
        </Flex>
      ),
    },
  ]

  return (
    <Box w="full" maxW="100%" minW={0}>
      <PageHeader>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {labels.pageTitle}
        </Heading>
      </PageHeader>

      {/* Toolbar */}
      <Flex
        justify="space-between"
        align="flex-start"
        mb={6}
        py={4}
        px={{ base: 3, md: 6 }}
        gap={{ base: 3, md: 4 }}
        flexDirection={{ base: 'column', sm: 'row' }}
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        bg="white"
      >
        {/* Left: search + filters (wraps internally at medium widths) */}
        <Flex gap={3} flex={1} w="full" flexWrap="wrap" align="center">
          {showSearch && (
            <InputGroup w={{ base: 'full', sm: '240px', lg: '280px' }} flexShrink={0}>
              <InputLeftElement pointerEvents="none" h={8}>
                <SearchIcon color="neutral.300" aria-hidden="true" />
              </InputLeftElement>
              <Input
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={labels.aria.search}
                bg="white"
                h={8}
                borderWidth="1px"
                borderRadius="4px"
                borderColor="neutral.300"
                _placeholder={{ color: 'neutral.300' }}
              />
            </InputGroup>
          )}
          {showStatusFilter && (
            <SearchableSelect
              options={statusOptions}
              value={statusFilter}
              height="32px"
              onChange={(val) => setStatusFilter(val as StatusFilter)}
              placeholder={t('statusLabel')}
              width={{ base: '100%', sm: '140px' }}
              isFilter
            />
          )}
        </Flex>
        <Button
          variant="secondary"
          size="sm"
          fontWeight="600"
          onClick={() => navigate(routes.add)}
          gap={1}
          w={{ base: 'full', sm: 'auto' }}
          flexShrink={0}
          aria-label={labels.addButton}
        >
          <IoAddOutline size={24} aria-hidden="true" />
          {labels.addButton}
        </Button>
      </Flex>

      <DataTable<UserAdminData>
        columns={columns}
        data={data}
        getRowKey={(row) => row.id}
        emptyMessage={labels.noItemsFound}
        isLoading={false}
        pagination={{
          enabled: true,
          page: page,
          pageSize: pageSize ?? 10,
          totalItems,
          onPageChange,
          onPageSizeChange,
          pageSizeOptions: [10, 25, 50],
        }}
      />
    </Box>
  )
}
