import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Heading, Text, Flex, SimpleGrid, IconButton } from '@chakra-ui/react'
import { StatusChip } from '@/shared/components/common'
import { useTranslation } from 'react-i18next'
import { EditIcon } from '@chakra-ui/icons'
import type { StateUT } from '../../types/states-uts'
import { ROUTES } from '@/shared/constants/routes'
import { useStateUTByIdQuery } from '../../services/query/use-super-admin-queries'

export function ViewStateUTPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const stateUTQuery = useStateUTByIdQuery(id)

  useEffect(() => {
    document.title = `${t('statesUts.viewTitle')} | JalSoochak`
  }, [t])

  const state: StateUT | null = stateUTQuery.data ?? null

  const handleEdit = () => {
    if (id) {
      navigate(ROUTES.SUPER_ADMIN_STATES_UTS_EDIT.replace(':id', id))
    }
  }

  if (stateUTQuery.isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('statesUts.title')}
        </Heading>
        <Flex role="status" aria-live="polite" align="center" justify="center" minH="200px">
          <Text color="neutral.600">{t('common:loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (!state) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('statesUts.title')}
        </Heading>
        <Text color="neutral.600" mt={4}>
          {t('statesUts.messages.notFound')}
        </Text>
      </Box>
    )
  }

  return (
    <Box w="full">
      {/* Page Header with Breadcrumb */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {t('statesUts.title')}
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
            onKeyDown={(e) => e.key === 'Enter' && navigate(ROUTES.SUPER_ADMIN_STATES_UTS)}
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
        {/* State/UT Details Section */}
        <Flex justify="space-between" align="flex-start" mb={4}>
          <Heading as="h2" size="h3" fontWeight="400" id="state-details-heading">
            {t('statesUts.details.title')}
          </Heading>
          <IconButton
            aria-label={`${t('statesUts.aria.editStateUt')} ${state.name}`}
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
              {state.name}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" mb={1}>
              {t('statesUts.details.code')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {state.code}
            </Text>
          </Box>
        </SimpleGrid>

        {/* State Admin Details Section */}
        <Heading as="h2" size="h3" fontWeight="400" mb={4} id="admin-details-heading">
          {t('statesUts.adminDetails.title')}
        </Heading>
        <SimpleGrid
          columns={{ base: 1, lg: 2 }}
          spacing={6}
          mb={7}
          aria-labelledby="admin-details-heading"
        >
          <Box>
            <Text textStyle="h10" mb={1}>
              {t('statesUts.adminDetails.firstName')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {state.admin.firstName}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" mb={1}>
              {t('statesUts.adminDetails.lastName')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {state.admin.lastName}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" mb={1}>
              {t('statesUts.adminDetails.email')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {state.admin.email}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" mb={1}>
              {t('statesUts.adminDetails.phone')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              +91 {state.admin.phone.replace(/(\d{5})(\d{5})/, '$1-$2')}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" mb={1}>
              {t('statesUts.adminDetails.secondaryEmail')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {state.admin.secondaryEmail || t('common:na')}
            </Text>
          </Box>
          <Box>
            <Text textStyle="h10" mb={1}>
              {t('statesUts.adminDetails.contactNumber')}
            </Text>
            <Text textStyle="h10" fontWeight="400">
              {state.admin.contactNumber || t('common:na')}
            </Text>
          </Box>
        </SimpleGrid>

        {/* Status Section */}
        <Heading as="h2" size="h3" fontWeight="400" mb={4} id="status-heading">
          {t('statesUts.statusSection.title')}
        </Heading>
        <StatusChip
          status={state.status}
          label={
            state.status === 'active' ? t('common:status.active') : t('common:status.inactive')
          }
        />
      </Box>
    </Box>
  )
}
