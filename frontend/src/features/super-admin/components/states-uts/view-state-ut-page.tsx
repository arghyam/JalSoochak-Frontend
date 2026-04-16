import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Heading,
  Text,
  Flex,
  SimpleGrid,
  IconButton,
  Input,
  Button,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from '@chakra-ui/react'
import { StatusChip, ToastContainer, PageHeader } from '@/shared/components/common'
import { useTranslation } from 'react-i18next'
import { EditIcon } from '@chakra-ui/icons'
import { ROUTES } from '@/shared/constants/routes'
import { isAlphabeticWithSpaces, exceedsMaxLength } from '@/shared/utils/validation'
import {
  useStatesUTsQuery,
  useStateAdminsByTenantQuery,
  useInviteUserMutation,
} from '../../services/query/use-super-admin-queries'
import { useToast } from '@/shared/hooks/use-toast'
import type { UserAdminData } from '@/shared/components/common'

export function ViewStateUTPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const { tenantCode } = useParams<{ tenantCode: string }>()
  const toast = useToast()

  const tenantsQuery = useStatesUTsQuery()
  const tenant = tenantsQuery.data?.find((t) => t.stateCode === tenantCode) ?? null
  const adminsQuery = useStateAdminsByTenantQuery(tenantCode)
  const inviteUserMutation = useInviteUserMutation()

  // Invite form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    phone: false,
    email: false,
  })

  useEffect(() => {
    document.title = `${t('statesUts.viewTitle')} | JalSoochak`
  }, [t])

  const MAX_NAME_LENGTH = 25
  const MAX_EMAIL_LENGTH = 60
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const isValidPhone = (v: string) => /^\d{10}$/.test(v)
  const isNameValid = (name: string) =>
    name.trim() !== '' &&
    !exceedsMaxLength(name, MAX_NAME_LENGTH) &&
    isAlphabeticWithSpaces(name.trim())

  const fieldErrors = {
    firstName: (() => {
      if (!touched.firstName) return ''
      if (!firstName.trim()) return t('common:validation.required')
      if (exceedsMaxLength(firstName, MAX_NAME_LENGTH))
        return t('common:validation.maxLength', { max: MAX_NAME_LENGTH })
      if (!isAlphabeticWithSpaces(firstName.trim())) return t('common:validation.alphabeticOnly')
      return ''
    })(),
    lastName: (() => {
      if (!touched.lastName) return ''
      if (!lastName.trim()) return t('common:validation.required')
      if (exceedsMaxLength(lastName, MAX_NAME_LENGTH))
        return t('common:validation.maxLength', { max: MAX_NAME_LENGTH })
      if (!isAlphabeticWithSpaces(lastName.trim())) return t('common:validation.alphabeticOnly')
      return ''
    })(),
    phone: (() => {
      if (!touched.phone) return ''
      if (!phone.trim()) return t('common:validation.required')
      if (!isValidPhone(phone)) return t('common:validation.invalidPhone')
      return ''
    })(),
    email: (() => {
      if (!touched.email) return ''
      if (!email.trim()) return t('common:validation.required')
      if (exceedsMaxLength(email, MAX_EMAIL_LENGTH))
        return t('common:validation.maxLength', { max: MAX_EMAIL_LENGTH })
      if (!isValidEmail(email)) return t('common:validation.invalidEmail')
      return ''
    })(),
  }

  const isInviteFormValid =
    isNameValid(firstName) &&
    isNameValid(lastName) &&
    isValidPhone(phone) &&
    email.trim() !== '' &&
    !exceedsMaxLength(email, MAX_EMAIL_LENGTH) &&
    isValidEmail(email)

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleInviteSubmit = async () => {
    setTouched({ firstName: true, lastName: true, phone: true, email: true })
    if (!isInviteFormValid || !tenantCode) return
    try {
      await inviteUserMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone,
        email: email.trim(),
        role: 'STATE_ADMIN',
        tenantCode,
      })
      toast.addToast(t('statesUts.messages.inviteSent'), 'success')
      setFirstName('')
      setLastName('')
      setPhone('')
      setEmail('')
      setTouched({ firstName: false, lastName: false, phone: false, email: false })
    } catch {
      toast.addToast(t('statesUts.messages.failedToAdd'), 'error')
    }
  }

  const handleEdit = () => {
    if (tenantCode) navigate(ROUTES.SUPER_ADMIN_STATES_UTS_EDIT.replace(':tenantCode', tenantCode))
  }

  if (tenantsQuery.isLoading) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('statesUts.viewTitle')}
          </Heading>
        </PageHeader>
        <Flex role="status" aria-live="polite" align="center" justify="center" minH="200px">
          <Text color="neutral.600">{t('common:loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (!tenant) {
    return (
      <Box w="full">
        <PageHeader>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('statesUts.viewTitle')}
          </Heading>
        </PageHeader>
        <Text color="neutral.600" mt={4}>
          {t('statesUts.messages.notFound')}
        </Text>
      </Box>
    )
  }

  const admins: UserAdminData[] = adminsQuery.data ?? []

  return (
    <Box w="full">
      <PageHeader>
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
      </PageHeader>

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
        <Flex
          direction="column"
          h="full"
          justify="space-between"
          minH={{ base: 'auto', lg: 'calc(100vh - 232px)' }}
        >
          <Box>
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
                color="neutral.950"
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
                status={tenant.status.toLowerCase()}
                label={t(`statesUts.statusSection.statuses.${tenant.status}`)}
              />
            </Box>

            {/* State Admin Details */}
            {adminsQuery.isLoading && (
              <Text color="neutral.600" textStyle="h10">
                {t('common:loading')}
              </Text>
            )}
            {!adminsQuery.isLoading &&
              !adminsQuery.isError &&
              (adminsQuery.data?.length ?? admins.length) === 0 && (
                <>
                  <Text color="neutral.500" textStyle="h10" mb={4}>
                    {t('statesUts.adminDetails.noAdminDescription')}
                  </Text>
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={4}>
                    <FormControl isRequired isInvalid={!!fieldErrors.firstName}>
                      <FormLabel textStyle="h10" mb={1}>
                        {t('statesUts.adminDetails.firstName')}
                      </FormLabel>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        onBlur={() => handleBlur('firstName')}
                        placeholder={t('common:enter')}
                        h={9}
                        maxW={{ base: '100%', lg: '486px' }}
                        borderColor="neutral.200"
                        _placeholder={{ color: 'neutral.300' }}
                        aria-required="true"
                      />
                      {fieldErrors.firstName && (
                        <FormErrorMessage>{fieldErrors.firstName}</FormErrorMessage>
                      )}
                    </FormControl>
                    <FormControl isRequired isInvalid={!!fieldErrors.lastName}>
                      <FormLabel textStyle="h10" mb={1}>
                        {t('statesUts.adminDetails.lastName')}
                      </FormLabel>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        onBlur={() => handleBlur('lastName')}
                        placeholder={t('common:enter')}
                        h={9}
                        borderColor="neutral.200"
                        _placeholder={{ color: 'neutral.300' }}
                        maxW={{ base: '100%', lg: '486px' }}
                        aria-required="true"
                      />
                      {fieldErrors.lastName && (
                        <FormErrorMessage>{fieldErrors.lastName}</FormErrorMessage>
                      )}
                    </FormControl>
                    <FormControl isRequired isInvalid={!!fieldErrors.phone}>
                      <FormLabel textStyle="h10" mb={1}>
                        {t('statesUts.adminDetails.phone')}
                      </FormLabel>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replaceAll(/\D/g, '')
                          if (val.length <= 10) setPhone(val)
                        }}
                        onBlur={() => handleBlur('phone')}
                        placeholder={t('common:enter')}
                        inputMode="numeric"
                        h={9}
                        borderColor="neutral.200"
                        maxW={{ base: '100%', lg: '486px' }}
                        _placeholder={{ color: 'neutral.300' }}
                        aria-required="true"
                      />
                      {fieldErrors.phone && (
                        <FormErrorMessage>{fieldErrors.phone}</FormErrorMessage>
                      )}
                    </FormControl>
                    <FormControl isRequired isInvalid={!!fieldErrors.email}>
                      <FormLabel textStyle="h10" mb={1}>
                        {t('statesUts.adminDetails.email')}
                      </FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => handleBlur('email')}
                        placeholder={t('common:enter')}
                        h={9}
                        borderColor="neutral.200"
                        _placeholder={{ color: 'neutral.300' }}
                        maxW={{ base: '100%', lg: '486px' }}
                        aria-required="true"
                      />
                      {fieldErrors.email && (
                        <FormErrorMessage>{fieldErrors.email}</FormErrorMessage>
                      )}
                    </FormControl>
                  </SimpleGrid>
                </>
              )}
            {!adminsQuery.isLoading && admins.length > 0 && (
              <Flex direction="column" gap={6}>
                {admins.map((admin) => {
                  const adminHeadingId = `admin-details-heading-${admin.id}`
                  return (
                    <Box key={admin.id}>
                      <Flex align="center" mb={4} gap={5}>
                        <Heading as="h2" size="h3" fontWeight="400" id={adminHeadingId}>
                          {t('statesUts.adminDetails.title')}
                        </Heading>
                        <StatusChip
                          status={admin.status}
                          label={admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
                        />
                      </Flex>
                      <SimpleGrid
                        columns={{ base: 1, lg: 2 }}
                        spacing={4}
                        aria-labelledby={adminHeadingId}
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
                    </Box>
                  )
                })}
              </Flex>
            )}
          </Box>
          {!adminsQuery.isLoading &&
            !adminsQuery.isError &&
            (adminsQuery.data?.length ?? admins.length) === 0 && (
              <HStack justify={{ base: 'stretch', sm: 'flex-end' }} mt={6}>
                <Button
                  variant="primary"
                  size="md"
                  width={{ base: 'full', sm: 'auto' }}
                  isLoading={inviteUserMutation.isPending}
                  isDisabled={inviteUserMutation.isPending}
                  onClick={() => void handleInviteSubmit()}
                >
                  {t('statesUts.buttons.sendInvite')}
                </Button>
              </HStack>
            )}
        </Flex>
      </Box>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
