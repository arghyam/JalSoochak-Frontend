import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Heading, Text, Flex, SimpleGrid, IconButton, Spinner } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { EditIcon } from '@chakra-ui/icons'
import { StatusChip } from '@/shared/components/common'
import { ROUTES } from '@/shared/constants/routes'
import { useStateUTAdminByIdQuery } from '../../services/query/use-state-admin-queries'

export function ViewStateUTAdminPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const adminQuery = useStateUTAdminByIdQuery(id)
  const admin = adminQuery.data ?? null

  useEffect(() => {
    document.title = `${t('stateUtAdmins.viewTitle')} | JalSoochak`
  }, [t])

  if (adminQuery.isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('stateUtAdmins.title')}
        </Heading>
        <Flex role="status" aria-live="polite" align="center" minH="200px" gap={3}>
          <Spinner size="md" color="primary.500" />
          <Text color="neutral.600">{t('common:loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (!admin) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('stateUtAdmins.title')}
        </Heading>
        <Text color="neutral.600" mt={4}>
          {t('stateUtAdmins.messages.notFound')}
        </Text>
      </Box>
    )
  }

  const handleEdit = () => {
    if (id) navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS_EDIT.replace(':id', id))
  }

  return (
    <Box w="full">
      {/* Page Header with Breadcrumb */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {t('stateUtAdmins.title')}
        </Heading>
        <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
          <Text
            as="a"
            fontSize="14px"
            lineHeight="21px"
            color="neutral.500"
            cursor="pointer"
            _hover={{ textDecoration: 'underline' }}
            onClick={() => navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS)}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS)}
          >
            {t('stateUtAdmins.breadcrumb.manage')}
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
            /
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
            {t('stateUtAdmins.breadcrumb.view')}
          </Text>
        </Flex>
      </Box>

      {/* Details Card */}
      <Box
        bg="white"
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        w="full"
        minH={{ base: 'auto', lg: 'calc(100vh - 180px)' }}
        py={6}
        px={{ base: 3, md: 4 }}
      >
        {/* User Details Section */}
        <Flex justify="space-between" align="flex-start" mb={4}>
          <Heading as="h2" size="h3" fontWeight="400" id="user-details-heading">
            {t('stateUtAdmins.form.userDetails')}
          </Heading>
          <IconButton
            aria-label={`${t('stateUtAdmins.aria.edit')} ${admin.firstName} ${admin.lastName}`}
            icon={<EditIcon boxSize={5} />}
            variant="ghost"
            size="sm"
            color="neutral.600"
            _hover={{ color: 'primary.500', bg: 'transparent' }}
            onClick={handleEdit}
          />
        </Flex>

        <SimpleGrid
          columns={{ base: 1, lg: 2 }}
          spacing={6}
          mb={7}
          aria-labelledby="user-details-heading"
        >
          <Box>
            <Text textStyle="h10" fontWeight="500" mb={1}>
              {t('stateUtAdmins.form.firstName')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {admin.firstName}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" fontWeight="500" mb={1}>
              {t('stateUtAdmins.form.lastName')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {admin.lastName}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" fontWeight="500" mb={1}>
              {t('stateUtAdmins.form.emailAddress')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {admin.email}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" fontWeight="500" mb={1}>
              {t('stateUtAdmins.form.phoneNumber')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              +91 {admin.phone.replace(/(\d{5})(\d{5})/, '$1-$2')}
            </Text>
          </Box>
        </SimpleGrid>

        {/* Status Section */}
        <Heading as="h2" size="h3" fontWeight="400" mb={4} id="status-heading">
          {t('stateUtAdmins.form.statusSection')}
        </Heading>
        <StatusChip
          status={admin.status}
          label={
            admin.status === 'active' ? t('common:status.active') : t('common:status.inactive')
          }
        />
      </Box>
    </Box>
  )
}
