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
  DataTable,
  type DataTableColumn,
  StatusChip,
  SearchableSelect,
} from '@/shared/components/common'
import type { StateUTAdmin } from '../../types/state-ut-admins'
import { ROUTES } from '@/shared/constants/routes'
import { useStateUTAdminsQuery } from '../../services/query/use-state-admin-queries'

type StatusFilter = 'all' | 'active' | 'inactive'

export function StateUTAdminsPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const navigate = useNavigate()
  const { data: admins = [], isLoading, isError, refetch } = useStateUTAdminsQuery()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    document.title = `${t('stateUtAdmins.title')} | JalSoochak`
  }, [t])

  if (isError) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('stateUtAdmins.title')}
        </Heading>
        <Flex h="64" align="center" justify="center" direction="column" gap={4} role="alert">
          <Text color="error.500">{t('common:toast.failedToLoad')}</Text>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            {t('common:retry')}
          </Button>
        </Flex>
      </Box>
    )
  }

  const statusOptions = [
    { value: 'all', label: t('stateUtAdmins.filters.allStatuses') },
    { value: 'active', label: t('common:status.active') },
    { value: 'inactive', label: t('common:status.inactive') },
  ]

  const filteredAdmins = admins.filter((admin) => {
    const fullName = `${admin.firstName} ${admin.lastName}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.phone.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || admin.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleView = (id: string) => {
    navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS_VIEW.replace(':id', id))
  }

  const handleEdit = (id: string) => {
    navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS_EDIT.replace(':id', id))
  }

  const columns: DataTableColumn<StateUTAdmin>[] = [
    {
      key: 'firstName',
      header: t('stateUtAdmins.table.name'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.firstName} {row.lastName}
        </Text>
      ),
    },
    {
      key: 'phone',
      header: t('stateUtAdmins.table.mobileNumber'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          +91 {row.phone.replace(/(\d{5})(\d{5})/, '$1-$2')}
        </Text>
      ),
    },
    {
      key: 'email',
      header: t('stateUtAdmins.table.emailAddress'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.email}
        </Text>
      ),
    },
    {
      key: 'status',
      header: t('stateUtAdmins.table.status'),
      sortable: false,
      render: (row) => (
        <StatusChip
          status={row.status}
          label={row.status === 'active' ? t('common:status.active') : t('common:status.inactive')}
        />
      ),
    },
    {
      key: 'id',
      header: t('stateUtAdmins.table.actions'),
      render: (row) => (
        <Flex gap={1}>
          <IconButton
            aria-label={`${t('stateUtAdmins.aria.view')} ${row.firstName} ${row.lastName}`}
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
            aria-label={`${t('stateUtAdmins.aria.edit')} ${row.firstName} ${row.lastName}`}
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
          {t('stateUtAdmins.title')}
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
          <InputGroup w={{ base: 'full', md: '240px' }}>
            <InputLeftElement pointerEvents="none" h={8}>
              <SearchIcon color="neutral.300" aria-hidden="true" />
            </InputLeftElement>
            <Input
              placeholder={t('common:search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t('stateUtAdmins.aria.search')}
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
            onChange={(val) => setStatusFilter(val as StatusFilter)}
            placeholder={t('common:statusLabel')}
            width={{ base: '100%', md: '140px' }}
            isFilter
          />
        </Flex>
        <Button
          variant="secondary"
          size="sm"
          fontWeight="600"
          onClick={() => navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS_ADD)}
          gap={1}
          w={{ base: 'full', md: 'auto' }}
          aria-label={t('stateUtAdmins.addAdmin')}
        >
          <IoAddOutline size={24} aria-hidden="true" />
          {t('stateUtAdmins.addAdmin')}
        </Button>
      </Flex>

      <DataTable<StateUTAdmin>
        columns={columns}
        data={filteredAdmins}
        getRowKey={(row) => row.id}
        emptyMessage={t('stateUtAdmins.messages.noAdminsFound')}
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
