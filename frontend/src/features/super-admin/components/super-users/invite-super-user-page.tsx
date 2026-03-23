import { useState, useEffect, useRef } from 'react'
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
import { useInviteUserMutation } from '../../services/query/use-super-admin-queries'

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export function InviteSuperUserPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const toast = useToast()
  const inviteMutation = useInviteUserMutation()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    document.title = `${t('superUsers.addTitle')} | JalSoochak`
  }, [t])

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current !== null) clearTimeout(navigateTimerRef.current)
    }
  }, [])

  const isPhoneValid = /^\d{10}$/.test(phoneNumber)
  const phoneError = phoneTouched && phoneNumber !== '' && !isPhoneValid
  const emailError = emailTouched && email !== '' && !isValidEmail(email)
  const isFormValid =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    isPhoneValid &&
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
        role: 'SUPER_USER',
      })
      toast.addToast(t('superUsers.messages.userAdded'), 'success')
      navigateTimerRef.current = setTimeout(() => {
        navigate(ROUTES.SUPER_ADMIN_SUPER_USERS)
      }, 1000)
    } catch {
      toast.addToast(t('superUsers.messages.failedToAdd'), 'error')
    }
  }

  return (
    <Box w="full">
      {/* Breadcrumb */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={2}>
          {t('superUsers.addTitle')}
        </Heading>
        <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
          <Text
            as="a"
            fontSize="14px"
            lineHeight="21px"
            color="neutral.500"
            cursor="pointer"
            _hover={{ textDecoration: 'underline' }}
            onClick={() => navigate(ROUTES.SUPER_ADMIN_SUPER_USERS)}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent) =>
              e.key === 'Enter' && navigate(ROUTES.SUPER_ADMIN_SUPER_USERS)
            }
          >
            {t('superUsers.breadcrumb.manage')}
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
            /
          </Text>
          <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
            {t('superUsers.breadcrumb.addNew')}
          </Text>
        </Flex>
      </Box>

      {/* Form Card */}
      <Box
        as="form"
        role="form"
        aria-label={t('superUsers.addTitle')}
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
              {t('superUsers.form.userDetails')}
            </Heading>
            <SimpleGrid
              columns={{ base: 1, lg: 2 }}
              spacing={6}
              aria-labelledby="user-details-heading"
            >
              <FormControl isRequired>
                <FormLabel textStyle="h10" mb={1}>
                  {t('superUsers.form.firstName')}
                </FormLabel>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('common:enter')}
                  h={9}
                  borderColor="neutral.200"
                  maxW={{ base: '100%', lg: '486px' }}
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel textStyle="h10" mb={1}>
                  {t('superUsers.form.lastName')}
                </FormLabel>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('common:enter')}
                  h={9}
                  borderColor="neutral.200"
                  maxW={{ base: '100%', lg: '486px' }}
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
              </FormControl>
              <FormControl isRequired isInvalid={phoneError}>
                <FormLabel textStyle="h10" mb={1}>
                  {t('superUsers.form.phoneNumber')}
                </FormLabel>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    const val = e.target.value.replaceAll(/\D/g, '')
                    if (val.length <= 10) setPhoneNumber(val)
                  }}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder={t('common:enter')}
                  inputMode="numeric"
                  maxW={{ base: '100%', lg: '486px' }}
                  h={9}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
                <FormErrorMessage>{t('common:validation.invalidPhone')}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={emailError}>
                <FormLabel textStyle="h10" mb={1}>
                  {t('superUsers.form.emailAddress')}
                </FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder={t('common:enter')}
                  h={9}
                  maxW={{ base: '100%', lg: '486px' }}
                  borderColor="neutral.200"
                  _placeholder={{ color: 'neutral.300' }}
                  aria-required="true"
                />
                <FormErrorMessage>{t('common:validation.invalidEmail')}</FormErrorMessage>
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
              onClick={() => navigate(ROUTES.SUPER_ADMIN_SUPER_USERS)}
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
              {t('superUsers.buttons.addAndSendLink')}
            </Button>
          </HStack>
        </Flex>
      </Box>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
