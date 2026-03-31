import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Heading,
  Text,
  Flex,
  Input,
  Button,
  HStack,
  SimpleGrid,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { ToastContainer } from '@/shared/components/common'
import { useToast } from '@/shared/hooks/use-toast'
import { ROUTES } from '@/shared/constants/routes'
import { useAuthStore } from '@/app/store/auth-store'
import { isAlphabeticWithSpaces, exceedsMaxLength } from '@/shared/utils/validation'
import { useInviteStateUTAdminMutation } from '../../services/query/use-state-admin-queries'

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const isValidPhone = (v: string) => /^\d{10}$/.test(v)
const MAX_NAME_LENGTH = 25

export function InviteStateUTAdminPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const navigate = useNavigate()
  const toast = useToast()
  const tenantCode = useAuthStore((state) => state.user?.tenantCode ?? '')
  const inviteMutation = useInviteStateUTAdminMutation()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    phone: false,
    email: false,
  })

  useEffect(() => {
    document.title = `${t('stateUtAdmins.addTitle')} | JalSoochak`
  }, [t])

  const handleBlur = (field: keyof typeof touched) =>
    setTouched((prev) => ({ ...prev, [field]: true }))

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
      if (!phoneNumber.trim()) return t('common:validation.required')
      if (!isValidPhone(phoneNumber)) return t('common:validation.invalidPhone')
      return ''
    })(),
    email: (() => {
      if (!touched.email) return ''
      if (!email.trim()) return t('common:validation.required')
      if (!isValidEmail(email)) return t('common:validation.invalidEmail')
      return ''
    })(),
  }

  const isFormValid =
    isNameValid(firstName) &&
    isNameValid(lastName) &&
    isValidPhone(phoneNumber) &&
    email.trim() !== '' &&
    isValidEmail(email)

  const handleSubmit = async () => {
    if (!isFormValid || inviteMutation.isPending) return
    try {
      await inviteMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber,
        email: email.trim(),
        tenantCode,
      })
      toast.addToast(t('stateUtAdmins.messages.adminAdded'), 'success')
      setTimeout(() => {
        navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS)
      }, 1000)
    } catch {
      toast.addToast(t('stateUtAdmins.messages.failedToAdd'), 'error')
    }
  }

  return (
    <Box w="full">
      {/* Breadcrumb */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {t('stateUtAdmins.addTitle')}
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
            onKeyDown={(e: React.KeyboardEvent) =>
              e.key === 'Enter' && navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS)
            }
          >
            {t('stateUtAdmins.breadcrumb.manage')}
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
            /
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
            {t('stateUtAdmins.breadcrumb.addNew')}
          </Text>
        </Flex>
      </Box>

      {/* Form Card */}
      <Box
        as="form"
        role="form"
        aria-label={t('stateUtAdmins.addTitle')}
        bg="white"
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        w="full"
        minH={{ base: 'auto', lg: 'calc(100vh - 180px)' }}
        py={6}
        px={{ base: 3, md: 4 }}
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault()
          void handleSubmit()
        }}
      >
        <Flex
          direction="column"
          h="full"
          justify="space-between"
          minH={{ base: 'auto', lg: 'calc(100vh - 232px)' }}
        >
          <Box>
            <Heading as="h2" size="h3" fontWeight="400" mb={4} id="user-details-heading">
              {t('stateUtAdmins.form.userDetails')}
            </Heading>
            <SimpleGrid
              columns={{ base: 1, lg: 2 }}
              spacing={6}
              aria-labelledby="user-details-heading"
            >
              <FormControl isRequired isInvalid={!!fieldErrors.firstName}>
                <FormLabel textStyle="h10" mb={1}>
                  {t('stateUtAdmins.form.firstName')}
                </FormLabel>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => handleBlur('firstName')}
                  placeholder={t('common:enter')}
                  h={9}
                  borderColor="neutral.200"
                  maxW={{ base: '100%', lg: '486px' }}
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
                {fieldErrors.firstName && (
                  <FormErrorMessage>{fieldErrors.firstName}</FormErrorMessage>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={!!fieldErrors.lastName}>
                <FormLabel textStyle="h10" mb={1}>
                  {t('stateUtAdmins.form.lastName')}
                </FormLabel>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => handleBlur('lastName')}
                  placeholder={t('common:enter')}
                  h={9}
                  borderColor="neutral.200"
                  maxW={{ base: '100%', lg: '486px' }}
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
                {fieldErrors.lastName && (
                  <FormErrorMessage>{fieldErrors.lastName}</FormErrorMessage>
                )}
              </FormControl>
              <FormControl isRequired isInvalid={!!fieldErrors.phone}>
                <FormLabel textStyle="h10" mb={1}>
                  {t('stateUtAdmins.form.phoneNumber')}
                </FormLabel>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    const val = e.target.value.replaceAll(/\D/g, '')
                    if (val.length <= 10) setPhoneNumber(val)
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
                {fieldErrors.phone && <FormErrorMessage>{fieldErrors.phone}</FormErrorMessage>}
              </FormControl>
              <FormControl isRequired isInvalid={!!fieldErrors.email}>
                <FormLabel textStyle="h10" mb={1}>
                  {t('stateUtAdmins.form.emailAddress')}
                </FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder={t('common:enter')}
                  h={9}
                  borderColor="neutral.200"
                  maxW={{ base: '100%', lg: '486px' }}
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
                {fieldErrors.email && <FormErrorMessage>{fieldErrors.email}</FormErrorMessage>}
              </FormControl>
            </SimpleGrid>
          </Box>

          {/* Action Buttons */}
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
              onClick={() => navigate(ROUTES.STATE_ADMIN_STATE_UT_ADMINS)}
              isDisabled={inviteMutation.isPending}
            >
              {t('common:button.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              width={{ base: 'full', sm: 'auto' }}
              maxWidth={{ base: '100%', sm: '310px' }}
              isLoading={inviteMutation.isPending}
              isDisabled={!isFormValid || inviteMutation.isPending}
            >
              {t('stateUtAdmins.buttons.addAndSendLink')}
            </Button>
          </HStack>
        </Flex>
      </Box>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
