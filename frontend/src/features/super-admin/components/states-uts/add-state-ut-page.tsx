import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Heading,
  Text,
  Flex,
  SimpleGrid,
  Input,
  Button,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { SearchableSelect, ToastContainer } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { ROUTES } from '@/shared/constants/routes'
import { INDIA_STATES } from '@/shared/constants/states'
import { isAlphabeticWithSpaces, exceedsMaxLength } from '@/shared/utils/validation'
import {
  useCreateTenantMutation,
  useInviteUserMutation,
  useStatesUTsQuery,
} from '../../services/query/use-super-admin-queries'
import type { Tenant } from '../../types/states-uts'

type AddStep = 'tenant' | 'invite'

export function AddStateUTPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    document.title = `${t('statesUts.addTitle')} | JalSoochak`
  }, [t])

  const createTenantMutation = useCreateTenantMutation()
  const inviteUserMutation = useInviteUserMutation()
  const { data: existingTenants, isLoading: isLoadingTenants } = useStatesUTsQuery()

  // Step state
  const [step, setStep] = useState<AddStep>('tenant')
  const [createdTenant, setCreatedTenant] = useState<Tenant | null>(null)

  // Step 1 — tenant fields
  const [stateName, setStateName] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [lgdCode, setLgdCode] = useState<number | null>(null)

  // Step 2 — admin invite fields
  const [adminFirstName, setAdminFirstName] = useState('')
  const [adminLastName, setAdminLastName] = useState('')
  const [adminPhone, setAdminPhone] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminTouched, setAdminTouched] = useState({
    firstName: false,
    lastName: false,
    phone: false,
    email: false,
  })

  const takenStateCodes = useMemo<Set<string>>(
    () => new Set((existingTenants ?? []).map((t) => t.stateCode)),
    [existingTenants]
  )

  const stateOptions = useMemo(
    () =>
      INDIA_STATES.filter((s) => !takenStateCodes.has(s.code)).map((s) => ({
        value: s.name,
        label: s.name,
      })),
    [takenStateCodes]
  )

  const handleStateChange = (value: string) => {
    setStateName(value)
    const selected = INDIA_STATES.find((s) => s.name === value)
    setStateCode(selected?.code ?? '')
    setLgdCode(selected?.lgdCode ?? null)
  }

  const MAX_NAME_LENGTH = 25
  const MAX_EMAIL_LENGTH = 60
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const isValidPhone = (v: string) => /^\d{10}$/.test(v)
  const isNameValid = (name: string) =>
    name.trim() !== '' &&
    !exceedsMaxLength(name, MAX_NAME_LENGTH) &&
    isAlphabeticWithSpaces(name.trim())

  const isTenantFormValid = stateName !== '' && stateCode !== '' && lgdCode !== null

  const isInviteFormValid =
    isNameValid(adminFirstName) &&
    isNameValid(adminLastName) &&
    isValidPhone(adminPhone) &&
    adminEmail.trim() !== '' &&
    !exceedsMaxLength(adminEmail, MAX_EMAIL_LENGTH) &&
    isValidEmail(adminEmail)

  const adminFieldErrors = {
    firstName: (() => {
      if (!adminTouched.firstName) return ''
      if (!adminFirstName.trim()) return t('common:validation.required')
      if (exceedsMaxLength(adminFirstName, MAX_NAME_LENGTH))
        return t('common:validation.maxLength', { max: MAX_NAME_LENGTH })
      if (!isAlphabeticWithSpaces(adminFirstName.trim()))
        return t('common:validation.alphabeticOnly')
      return ''
    })(),
    lastName: (() => {
      if (!adminTouched.lastName) return ''
      if (!adminLastName.trim()) return t('common:validation.required')
      if (exceedsMaxLength(adminLastName, MAX_NAME_LENGTH))
        return t('common:validation.maxLength', { max: MAX_NAME_LENGTH })
      if (!isAlphabeticWithSpaces(adminLastName.trim()))
        return t('common:validation.alphabeticOnly')
      return ''
    })(),
    phone: (() => {
      if (!adminTouched.phone) return ''
      if (!adminPhone.trim()) return t('common:validation.required')
      if (!isValidPhone(adminPhone)) return t('common:validation.invalidPhone')
      return ''
    })(),
    email: (() => {
      if (!adminTouched.email) return ''
      if (!adminEmail.trim()) return t('common:validation.required')
      if (exceedsMaxLength(adminEmail, MAX_EMAIL_LENGTH))
        return t('common:validation.maxLength', { max: MAX_EMAIL_LENGTH })
      if (!isValidEmail(adminEmail)) return t('common:validation.invalidEmail')
      return ''
    })(),
  }

  const handleAdminBlur = (field: keyof typeof adminTouched) => {
    setAdminTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleCreateTenant = async () => {
    if (!isTenantFormValid || lgdCode === null) return
    try {
      const tenant = await createTenantMutation.mutateAsync({
        stateCode,
        name: stateName.trim(),
        lgdCode,
      })
      toast.addToast(t('statesUts.messages.tenantCreatedSuccess'), 'success')
      setCreatedTenant(tenant)
      setStep('invite')
    } catch {
      toast.addToast(t('statesUts.messages.failedToAdd'), 'error')
    }
  }

  const handleSendInvite = async () => {
    setAdminTouched({ firstName: true, lastName: true, phone: true, email: true })
    if (!isInviteFormValid || !createdTenant) return
    try {
      await inviteUserMutation.mutateAsync({
        firstName: adminFirstName.trim(),
        lastName: adminLastName.trim(),
        phoneNumber: adminPhone,
        email: adminEmail.trim(),
        role: 'STATE_ADMIN',
        tenantCode: createdTenant.stateCode,
      })
      toast.addToast(t('statesUts.messages.inviteSent'), 'success')
      setTimeout(() => {
        navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':tenantCode', createdTenant.stateCode))
      }, 1000)
    } catch {
      toast.addToast(t('statesUts.messages.failedToAdd'), 'error')
    }
  }

  const handleSkip = () => {
    if (createdTenant) {
      navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':tenantCode', createdTenant.stateCode))
    }
  }

  const isStep1Pending = isLoadingTenants || createTenantMutation.isPending
  const isStep2Pending = inviteUserMutation.isPending

  return (
    <Box w="full">
      {/* Breadcrumb */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {t('statesUts.addTitle')}
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
            {t('statesUts.breadcrumb.addNew')}
          </Text>
        </Flex>
      </Box>

      {/* Form Card */}
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
            {/* Step indicator */}
            <Text fontSize="13px" color="neutral.500" mb={4}>
              {t('statesUts.step', {
                current: step === 'tenant' ? 1 : 2,
                total: 2,
              })}
            </Text>

            {step === 'tenant' && (
              <>
                {/* State/UT Details */}
                <Heading as="h2" size="h3" fontWeight="400" mb={4} id="state-details-heading">
                  {t('statesUts.details.title')}
                </Heading>
                <SimpleGrid
                  columns={{ base: 1, lg: 2 }}
                  spacing={6}
                  mb={7}
                  aria-labelledby="state-details-heading"
                >
                  <FormControl isRequired>
                    <FormLabel htmlFor="state-name-select" textStyle="h10" mb={1}>
                      {t('statesUts.details.name')}
                    </FormLabel>
                    <SearchableSelect
                      id="state-name-select"
                      options={stateOptions}
                      value={stateName}
                      onChange={handleStateChange}
                      placeholder={t('common:select')}
                      placeholderColor="neutral.300"
                      width={{ base: '100%', xl: '486px' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel textStyle="h10" mb={1}>
                      {t('statesUts.details.code')}
                    </FormLabel>
                    <Input
                      value={stateCode}
                      isReadOnly
                      bg="neutral.50"
                      h={9}
                      maxW={{ base: '100%', lg: '486px' }}
                      borderColor="neutral.200"
                      color="neutral.500"
                      aria-readonly="true"
                      placeholder={t('statesUts.details.autoFilledOnStateSelection')}
                      _placeholder={{ color: 'neutral.300' }}
                    />
                  </FormControl>
                </SimpleGrid>
              </>
            )}

            {step === 'invite' && createdTenant && (
              <>
                {/* Read-only tenant summary */}
                <Heading as="h2" size="h3" fontWeight="400" mb={4} id="state-details-heading">
                  {t('statesUts.details.title')}
                </Heading>
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
                      {createdTenant.name}
                    </Text>
                  </Box>
                  <Box>
                    <Text textStyle="h10" fontWeight="500" mb={1}>
                      {t('statesUts.details.stateCode')}
                    </Text>
                    <Text textStyle="h10" fontWeight="400">
                      {createdTenant.stateCode}
                    </Text>
                  </Box>
                  <Box>
                    <Text textStyle="h10" fontWeight="500" mb={1}>
                      {t('statesUts.details.lgdCode')}
                    </Text>
                    <Text textStyle="h10" fontWeight="400">
                      {createdTenant.lgdCode}
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* State Admin Invite */}
                <Heading as="h2" size="h3" fontWeight="400" mb={4} id="admin-details-heading">
                  {t('statesUts.adminDetails.title')}
                </Heading>
                <SimpleGrid
                  columns={{ base: 1, lg: 2 }}
                  spacing={6}
                  aria-labelledby="admin-details-heading"
                >
                  <FormControl isRequired isInvalid={!!adminFieldErrors.firstName}>
                    <FormLabel textStyle="h10" mb={1}>
                      {t('statesUts.adminDetails.firstName')}
                    </FormLabel>
                    <Input
                      value={adminFirstName}
                      onChange={(e) => setAdminFirstName(e.target.value)}
                      onBlur={() => handleAdminBlur('firstName')}
                      placeholder={t('common:enter')}
                      h={9}
                      maxW={{ base: '100%', lg: '486px' }}
                      borderColor="neutral.200"
                      _placeholder={{ color: 'neutral.300' }}
                      aria-required="true"
                    />
                    {adminFieldErrors.firstName && (
                      <FormErrorMessage>{adminFieldErrors.firstName}</FormErrorMessage>
                    )}
                  </FormControl>
                  <FormControl isRequired isInvalid={!!adminFieldErrors.lastName}>
                    <FormLabel textStyle="h10" mb={1}>
                      {t('statesUts.adminDetails.lastName')}
                    </FormLabel>
                    <Input
                      value={adminLastName}
                      onChange={(e) => setAdminLastName(e.target.value)}
                      onBlur={() => handleAdminBlur('lastName')}
                      placeholder={t('common:enter')}
                      h={9}
                      borderColor="neutral.200"
                      _placeholder={{ color: 'neutral.300' }}
                      maxW={{ base: '100%', lg: '486px' }}
                      aria-required="true"
                    />
                    {adminFieldErrors.lastName && (
                      <FormErrorMessage>{adminFieldErrors.lastName}</FormErrorMessage>
                    )}
                  </FormControl>
                  <FormControl isRequired isInvalid={!!adminFieldErrors.phone}>
                    <FormLabel textStyle="h10" mb={1}>
                      {t('statesUts.adminDetails.phone')}
                    </FormLabel>
                    <Input
                      type="tel"
                      value={adminPhone}
                      onChange={(e) => {
                        const val = e.target.value.replaceAll(/\D/g, '')
                        if (val.length <= 10) setAdminPhone(val)
                      }}
                      onBlur={() => handleAdminBlur('phone')}
                      placeholder={t('common:enter')}
                      inputMode="numeric"
                      h={9}
                      borderColor="neutral.200"
                      maxW={{ base: '100%', lg: '486px' }}
                      _placeholder={{ color: 'neutral.300' }}
                      aria-required="true"
                    />
                    {adminFieldErrors.phone && (
                      <FormErrorMessage>{adminFieldErrors.phone}</FormErrorMessage>
                    )}
                  </FormControl>
                  <FormControl isRequired isInvalid={!!adminFieldErrors.email}>
                    <FormLabel textStyle="h10" mb={1}>
                      {t('statesUts.adminDetails.email')}
                    </FormLabel>
                    <Input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      onBlur={() => handleAdminBlur('email')}
                      placeholder={t('common:enter')}
                      h={9}
                      borderColor="neutral.200"
                      _placeholder={{ color: 'neutral.300' }}
                      maxW={{ base: '100%', lg: '486px' }}
                      aria-required="true"
                    />
                    {adminFieldErrors.email && (
                      <FormErrorMessage>{adminFieldErrors.email}</FormErrorMessage>
                    )}
                  </FormControl>
                </SimpleGrid>
              </>
            )}
          </Box>

          {/* Action Buttons */}
          {step === 'tenant' && (
            <HStack
              spacing={3}
              justify={{ base: 'stretch', sm: 'flex-end' }}
              mt={6}
              flexDirection={{ base: 'column-reverse', sm: 'row' }}
            >
              <Button
                variant="secondary"
                size="md"
                width={{ base: 'full', sm: '174px' }}
                onClick={() => navigate(ROUTES.SUPER_ADMIN_STATES_UTS)}
                isDisabled={isStep1Pending}
              >
                {t('common:button.cancel')}
              </Button>
              <Button
                variant="primary"
                size="md"
                width={{ base: 'full', sm: 'auto' }}
                maxWidth={{ base: '100%', sm: '275px' }}
                isLoading={isStep1Pending}
                isDisabled={!isTenantFormValid || isStep1Pending}
                onClick={() => void handleCreateTenant()}
              >
                {t('statesUts.buttons.createStateUt')}
              </Button>
            </HStack>
          )}

          {step === 'invite' && (
            <HStack
              spacing={3}
              justify={{ base: 'stretch', sm: 'flex-end' }}
              mt={6}
              flexDirection={{ base: 'column-reverse', sm: 'row' }}
            >
              <Button
                variant="secondary"
                size="md"
                width={{ base: 'full', sm: '174px' }}
                onClick={handleSkip}
                isDisabled={isStep2Pending}
              >
                {t('statesUts.buttons.skipForNow')}
              </Button>
              <Button
                variant="primary"
                size="md"
                width={{ base: 'full', sm: 'auto' }}
                maxWidth={{ base: '100%', sm: '275px' }}
                isLoading={isStep2Pending}
                isDisabled={isStep2Pending}
                onClick={() => void handleSendInvite()}
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
