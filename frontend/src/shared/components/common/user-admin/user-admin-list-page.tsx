import { useState } from 'react'
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
import { DataTable, type DataTableColumn } from '../data-table'
import { StatusChip } from '../atom/status-chip'
import { SearchableSelect } from '../searchable-select'
import type { UserAdminData, UserAdminRoutes, UserAdminListLabels } from './types'

type StatusFilter = 'all' | 'active' | 'inactive'

export interface UserAdminListPageProps {
  readonly data: UserAdminData[]
  readonly isLoading: boolean
  readonly isError: boolean
  readonly onRefetch: () => void
  readonly routes: UserAdminRoutes
  readonly labels: UserAdminListLabels
}

export function UserAdminListPage({
  data,
  isLoading,
  isError,
  onRefetch,
  routes,
  labels,
}: UserAdminListPageProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  if (isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {labels.pageTitle}
        </Heading>
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
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {labels.pageTitle}
        </Heading>
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
  ]

  const filteredData = data.filter((item) => {
    const fullName = `${item.firstName} ${item.lastName}`.toLowerCase()
    const normalizedPhone = item.phone.replace(/\D/g, '')
    const normalizedQuery = searchQuery.replace(/\D/g, '')
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (normalizedQuery.length > 0 && normalizedPhone.includes(normalizedQuery))
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
      render: (row) => (
        <StatusChip
          status={row.status}
          label={row.status === 'active' ? t('status.active') : t('status.inactive')}
        />
      ),
    },
    {
      key: 'id',
      header: labels.table.actions,
      render: (row) => (
        <Flex gap={1}>
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
        </Flex>
      ),
    },
  ]

  return (
    <Box w="full" maxW="100%" minW={0}>
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {labels.pageTitle}
        </Heading>
      </Box>

      {/* Toolbar */}
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
          <InputGroup w={{ base: 'full', md: '240px', lg: '404px' }}>
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
          <SearchableSelect
            options={statusOptions}
            value={statusFilter}
            height="32px"
            onChange={(val) => setStatusFilter(val as StatusFilter)}
            placeholder={t('statusLabel')}
            width={{ base: '100%', md: '140px' }}
            isFilter
          />
        </Flex>
        <Button
          variant="secondary"
          size="sm"
          fontWeight="600"
          onClick={() => navigate(routes.add)}
          gap={1}
          w={{ base: 'full', md: 'auto' }}
          aria-label={labels.addButton}
        >
          <IoAddOutline size={24} aria-hidden="true" />
          {labels.addButton}
        </Button>
      </Flex>

      <DataTable<UserAdminData>
        columns={columns}
        data={filteredData}
        getRowKey={(row) => row.id}
        emptyMessage={labels.noItemsFound}
        isLoading={false}
        pagination={{
          enabled: true,
          pageSize: 10,
          pageSizeOptions: [10, 25, 50],
        }}
      />
    </Box>
  )
}
