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
  useBreakpointValue,
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
  AppButton,
} from '@/shared/components/common'
import type { StateAdmin, StateAdminSignupStatus } from '../../types/state-admins'
import { ROUTES } from '@/shared/constants/routes'
import { useStateAdminsQuery } from '../../services/query/use-super-admin-queries'

export function ManageStateAdminsPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const { data: admins = [], isLoading, isError, refetch } = useStateAdminsQuery()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StateAdminSignupStatus | ''>('')

  const showAddButtonText = useBreakpointValue({ base: false, sm: true }) ?? true

  useEffect(() => {
    document.title = `${t('manageStateAdmins.title')} | JalSoochak`
  }, [t])

  if (isError) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('manageStateAdmins.title')}
        </Heading>
        <Flex h="64" align="center" justify="center" direction="column" gap={4} role="alert">
          <Text color="error.500">{t('common:toast.failedToLoad')}</Text>
          <AppButton variant="secondary" size="sm" onClick={() => void refetch()}>
            {t('common:retry')}
          </AppButton>
        </Flex>
      </Box>
    )
  }

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.stateUt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || admin.signupStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleView = (row: StateAdmin) => {
    if (row.stateUtId) {
      navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':id', row.stateUtId))
    }
  }

  const handleEdit = (row: StateAdmin) => {
    if (row.stateUtId) {
      navigate(ROUTES.SUPER_ADMIN_STATES_UTS_EDIT.replace(':id', row.stateUtId))
    }
  }

  const handleAddNew = () => {
    navigate(ROUTES.SUPER_ADMIN_STATES_UTS_ADD)
  }

  const columns: DataTableColumn<StateAdmin>[] = [
    {
      key: 'adminName',
      header: t('manageStateAdmins.table.adminName'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.adminName}
        </Text>
      ),
    },
    {
      key: 'stateUt',
      header: t('manageStateAdmins.table.stateUt'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.stateUt}
        </Text>
      ),
    },
    {
      key: 'mobileNumber',
      header: t('manageStateAdmins.table.mobileNumber'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.mobileNumber}
        </Text>
      ),
    },
    {
      key: 'emailAddress',
      header: t('manageStateAdmins.table.emailAddress'),
      sortable: false,
      render: (row) => (
        <Text textStyle="h10" fontWeight="400">
          {row.emailAddress}
        </Text>
      ),
    },
    {
      key: 'signupStatus',
      header: t('manageStateAdmins.table.signupStatus'),
      sortable: false,
      render: (row) => (
        <StatusChip
          status={row.signupStatus}
          label={
            row.signupStatus === 'completed'
              ? t('manageStateAdmins.status.completed')
              : t('manageStateAdmins.status.pending')
          }
        />
      ),
    },
    {
      key: 'actions',
      header: t('manageStateAdmins.table.actions'),
      render: (row) => (
        <Flex gap={1}>
          <AppButton
            variant="tertiary"
            size="sm"
            iconOnly={<FiEye aria-hidden="true" size={20} />}
            ariaLabel={`${t('manageStateAdmins.aria.viewAdmin')} ${row.adminName}`}
            onClick={() => handleView(row)}
          />
          <AppButton
            variant="tertiary"
            size="sm"
            iconOnly={<EditIcon aria-hidden="true" w={5} h={5} />}
            ariaLabel={`${t('manageStateAdmins.aria.editAdmin')} ${row.adminName}`}
            onClick={() => handleEdit(row)}
          />
        </Flex>
      ),
    },
  ]

  return (
    <Box w="full" maxW="100%" minW={0}>
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('manageStateAdmins.title')}
        </Heading>
      </Box>

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
        <Flex flex={1} gap={3} align="center" wrap="wrap" w={{ base: 'full', md: 'auto' }}>
          <InputGroup w={{ base: 'full', md: '320px' }}>
            <InputLeftElement pointerEvents="none" h={8}>
              <SearchIcon color="neutral.300" aria-hidden="true" />
            </InputLeftElement>
            <Input
              placeholder={t('common:search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t('manageStateAdmins.searchPlaceholder')}
              bg="white"
              h={8}
              borderWidth="1px"
              borderRadius="4px"
              borderColor="neutral.300"
              _placeholder={{ color: 'neutral.300' }}
            />
          </InputGroup>
          <SearchableSelect
            options={[
              { value: 'completed', label: t('manageStateAdmins.status.completed') },
              { value: 'pending', label: t('manageStateAdmins.status.pending') },
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as StateAdminSignupStatus | '')}
            placeholder={t('manageStateAdmins.statusFilterPlaceholder')}
            isFilter
            width={{ base: 'full', md: '160px' }}
            height="32px"
            borderRadius="4px"
            ariaLabel={t('manageStateAdmins.statusFilterLabel')}
          />
          <AppButton
            variant="tertiary"
            size="sm"
            onClick={() => setStatusFilter('')}
            isDisabled={!statusFilter}
          >
            {t('manageStateAdmins.clearAll')}
          </AppButton>
        </Flex>
        <AppButton
          variant="secondary"
          size="sm"
          onClick={handleAddNew}
          leftIcon={<IoAddOutline size={24} aria-hidden="true" />}
          w={{ base: 'full', md: '178px' }}
          aria-label={t('manageStateAdmins.addNewStateUt')}
        >
          {showAddButtonText ? t('manageStateAdmins.addNewStateUt') : ''}
        </AppButton>
      </Flex>

      <DataTable<StateAdmin>
        columns={columns}
        data={filteredAdmins}
        getRowKey={(row) => row.id}
        emptyMessage={t('manageStateAdmins.messages.noAdminsFound')}
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
