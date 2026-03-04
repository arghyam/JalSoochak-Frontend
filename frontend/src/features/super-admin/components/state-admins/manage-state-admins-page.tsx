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
  useBreakpointValue,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { SearchIcon, EditIcon } from '@chakra-ui/icons'
import { FiEye } from 'react-icons/fi'
import { FiDownload } from 'react-icons/fi'
import { DataTable, type DataTableColumn, StatusChip } from '@/shared/components/common'
import type { StateAdmin } from '../../types/state-admins'
import { ROUTES } from '@/shared/constants/routes'
import { useStateAdminsQuery } from '../../services/query/use-super-admin-queries'

export function ManageStateAdminsPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const { data: admins = [], isLoading, isError, refetch } = useStateAdminsQuery()
  const [searchQuery, setSearchQuery] = useState('')

  const showDownloadButtonText = useBreakpointValue({ base: false, sm: true }) ?? true

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

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.stateUt.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  const handleDownloadReport = () => {
    // No-op for now
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
        <Button
          variant="secondary"
          size="sm"
          fontWeight="600"
          onClick={handleDownloadReport}
          gap={1}
          w={{ base: 'full', md: '178px' }}
          aria-label={t('manageStateAdmins.downloadReport')}
        >
          <FiDownload size={20} aria-hidden="true" />
          {showDownloadButtonText && t('manageStateAdmins.downloadReport')}
        </Button>
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
