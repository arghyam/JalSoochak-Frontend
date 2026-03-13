import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Heading, Text, Flex, SimpleGrid, IconButton } from '@chakra-ui/react'
import { StatusChip } from '@/shared/components/common'
import { useTranslation } from 'react-i18next'
import { EditIcon } from '@chakra-ui/icons'
import { ROUTES } from '@/shared/constants/routes'
import {
  useTenantByIdQuery,
  useStateAdminsByTenantQuery,
} from '../../services/query/use-super-admin-queries'
import type { UserAdminData } from '@/shared/components/common'

export function ViewStateUTPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const tenantId = id ? Number(id) : undefined

  const tenantQuery = useTenantByIdQuery(tenantId)
  const tenant = tenantQuery.data ?? null
  const adminsQuery = useStateAdminsByTenantQuery(tenant?.stateCode)

  useEffect(() => {
    document.title = `${t('statesUts.viewTitle')} | JalSoochak`
  }, [t])

  const handleEdit = () => {
    if (id) navigate(ROUTES.SUPER_ADMIN_STATES_UTS_EDIT.replace(':id', id))
  }

  if (tenantQuery.isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('statesUts.viewTitle')}
        </Heading>
        <Flex role="status" aria-live="polite" align="center" justify="center" minH="200px">
          <Text color="neutral.600">{t('common:loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (!tenant) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('statesUts.viewTitle')}
        </Heading>
        <Text color="neutral.600" mt={4}>
          {t('statesUts.messages.notFound')}
        </Text>
      </Box>
    )
  }

  const admins: UserAdminData[] = adminsQuery.data ?? []

  return (
    <Box w="full">
      {/* Breadcrumb */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {t('statesUts.viewTitle')}
        </Heading>
        <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
          <Text
            as="a"
            fontSize="14px"
            lineHeight="21px"
            color="neutral.500"
            cursor="pointer"
            _hover={{ textDecoration: 'underline' }}
            onClick={() => navigate(ROUTES.SUPER_ADMIN_STATES_UTS)}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) =>
              e.key === 'Enter' && navigate(ROUTES.SUPER_ADMIN_STATES_UTS)
            }
          >
            {t('statesUts.breadcrumb.manage')}
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
            /
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
            {t('statesUts.breadcrumb.view')}
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
        {/* State/UT Details */}
        <Flex justify="space-between" align="flex-start" mb={4}>
          <Heading as="h2" size="h3" fontWeight="400" id="state-details-heading">
            {t('statesUts.details.title')}
          </Heading>
          <IconButton
            aria-label={`${t('statesUts.aria.editStateUt')} ${tenant.name}`}
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
          aria-labelledby="state-details-heading"
        >
          <Box>
            <Text textStyle="h10" fontWeight="500" mb={1}>
              {t('statesUts.details.name')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {tenant.name}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" fontWeight="500" mb={1}>
              {t('statesUts.details.stateCode')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {tenant.stateCode}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" fontWeight="500" mb={1}>
              {t('statesUts.details.lgdCode')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {tenant.lgdCode}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" fontWeight="500" mb={1}>
              {t('statesUts.details.createdAt')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {new Date(tenant.createdAt).toLocaleDateString()}
            </Text>
          </Box>
        </SimpleGrid>

        {/* Status Section */}
        <Heading as="h2" size="h3" fontWeight="400" mb={4} id="status-heading">
          {t('statesUts.statusSection.title')}
        </Heading>
        <Box mb={7}>
          <StatusChip
            status={tenant.status === 'ACTIVE' ? 'active' : 'inactive'}
            label={
              tenant.status === 'ACTIVE' ? t('common:status.active') : t('common:status.inactive')
            }
          />
        </Box>

        {/* State Admin Details */}
        <Heading as="h2" size="h3" fontWeight="400" mb={4} id="admin-details-heading">
          {t('statesUts.adminDetails.title')}
        </Heading>
        {adminsQuery.isLoading && (
          <Text color="neutral.600" textStyle="h10">
            {t('common:loading')}
          </Text>
        )}
        {!adminsQuery.isLoading && admins.length === 0 && (
          <Text color="neutral.400" textStyle="h10">
            {t('common:na')}
          </Text>
        )}
        {!adminsQuery.isLoading && admins.length > 0 && (
          <Flex direction="column" gap={6}>
            {admins.map((admin) => (
              <SimpleGrid
                key={admin.id}
                columns={{ base: 1, lg: 2 }}
                spacing={4}
                aria-labelledby="admin-details-heading"
              >
                <Box>
                  <Text textStyle="h10" fontWeight="500" mb={1}>
                    {t('statesUts.adminDetails.firstName')}
                  </Text>
                  <Text textStyle="h10" fontWeight="400">
                    {admin.firstName || t('common:na')}
                  </Text>
                </Box>
                <Box>
                  <Text textStyle="h10" fontWeight="500" mb={1}>
                    {t('statesUts.adminDetails.lastName')}
                  </Text>
                  <Text textStyle="h10" fontWeight="400">
                    {admin.lastName || t('common:na')}
                  </Text>
                </Box>
                <Box>
                  <Text textStyle="h10" fontWeight="500" mb={1}>
                    {t('statesUts.adminDetails.email')}
                  </Text>
                  <Text textStyle="h10" fontWeight="400">
                    {admin.email}
                  </Text>
                </Box>
                <Box>
                  <Text textStyle="h10" fontWeight="500" mb={1}>
                    {t('statesUts.adminDetails.phone')}
                  </Text>
                  <Text textStyle="h10" fontWeight="400">
                    {admin.phone || t('common:na')}
                  </Text>
                </Box>
              </SimpleGrid>
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  )
}
