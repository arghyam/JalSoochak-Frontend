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
import { MdOutlineEmail } from 'react-icons/md'
import {
  ActionTooltip,
  DataTable,
  type DataTableColumn,
  StatusChip,
  ToastContainer,
} from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import type { StateAdmin } from '../../types/state-admins'
import { ROUTES } from '@/shared/constants/routes'
import {
  useStateAdminsQuery,
  useReinviteStateAdminMutation,
} from '../../services/query/use-super-admin-queries'

export function ManageStateAdminsPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { data, isLoading, isError, refetch } = useStateAdminsQuery(page, pageSize)
  const reinviteMutation = useReinviteStateAdminMutation()
  const toast = useToast()
  const [searchQuery, setSearchQuery] = useState('')

  const handleReinvite = (id: string) => {
    reinviteMutation.mutate(id, {
      onSuccess: () => toast.success(t('common:toast.reinviteSent')),
      onError: () => toast.error(t('common:toast.reinviteFailed')),
    })
  }

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
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            {t('common:retry')}
          </Button>
        </Flex>
      </Box>
    )
  }

  const filteredAdmins = (data?.items ?? []).filter(
    (admin) =>
      admin.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.stateUt.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleView = (row: StateAdmin) => {
    if (row.stateUt) {
      navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':tenantCode', row.stateUt))
    }
  }

  const handleEdit = (row: StateAdmin) => {
    if (row.stateUt) {
      navigate(ROUTES.SUPER_ADMIN_STATES_UTS_EDIT.replace(':tenantCode', row.stateUt))
    }
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
      render: (row) => {
        let statusLabel: string
        if (row.signupStatus === 'completed') {
          statusLabel = t('manageStateAdmins.status.completed')
        } else if (row.signupStatus === 'inactive') {
          statusLabel = t('manageStateAdmins.status.inactive')
        } else {
          statusLabel = t('manageStateAdmins.status.pending')
        }
        return <StatusChip status={row.signupStatus} label={statusLabel} />
      },
    },
    {
      key: 'actions',
      header: t('manageStateAdmins.table.actions'),
      render: (row) => (
        <Flex gap={1}>
          <ActionTooltip label={t('manageStateAdmins.aria.viewAdmin')}>
            <IconButton
              aria-label={`${t('manageStateAdmins.aria.viewAdmin')} ${row.adminName}`}
              icon={<FiEye aria-hidden="true" size={20} />}
              variant="ghost"
              width={5}
              minW={5}
              height={5}
              color="neutral.950"
              fontWeight="400"
              onClick={() => handleView(row)}
              _hover={{ color: 'primary.500', bg: 'transparent' }}
            />
          </ActionTooltip>
          <ActionTooltip label={t('manageStateAdmins.aria.editAdmin')}>
            <IconButton
              aria-label={`${t('manageStateAdmins.aria.editAdmin')} ${row.adminName}`}
              icon={<EditIcon aria-hidden="true" w={5} h={5} />}
              variant="ghost"
              width={5}
              minW={5}
              height={5}
              color="neutral.950"
              fontWeight="400"
              onClick={() => handleEdit(row)}
              _hover={{ color: 'primary.500', bg: 'transparent' }}
            />
          </ActionTooltip>
          {row.signupStatus === 'pending' && (
            <ActionTooltip label={t('manageStateAdmins.aria.resendInvite')}>
              <IconButton
                aria-label={`${t('manageStateAdmins.aria.resendInvite')} ${row.adminName}`}
                icon={<MdOutlineEmail aria-hidden="true" size={20} />}
                variant="ghost"
                width={5}
                minW={5}
                height={5}
                color="neutral.950"
                fontWeight="400"
                onClick={() => handleReinvite(row.id)}
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
      </Flex>

      <DataTable<StateAdmin>
        columns={columns}
        data={filteredAdmins}
        getRowKey={(row) => row.id}
        emptyMessage={t('manageStateAdmins.messages.noAdminsFound')}
        isLoading={isLoading}
        pagination={{
          enabled: true,
          page: page,
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
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
