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
import {
  useCreateTenantMutation,
  useInviteUserMutation,
} from '../../services/query/use-super-admin-queries'

export function AddStateUTPage() {
  const { t } = useTranslation(['super-admin', 'common'])
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    document.title = `${t('statesUts.addTitle')} | JalSoochak`
  }, [t])

  const createTenantMutation = useCreateTenantMutation()
  const inviteUserMutation = useInviteUserMutation()

  const [stateName, setStateName] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stateOptions = useMemo(
    () => INDIA_STATES.map((s) => ({ value: s.name, label: s.name })),
    []
  )

  const handleStateChange = (value: string) => {
    setStateName(value)
    const selected = INDIA_STATES.find((s) => s.name === value)
    setStateCode(selected?.code ?? '')
  }

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const emailError = emailTouched && adminEmail !== '' && !isValidEmail(adminEmail)

  const isFormValid =
    stateName !== '' && stateCode !== '' && adminEmail.trim() !== '' && isValidEmail(adminEmail)

  const handleCancel = () => navigate(ROUTES.SUPER_ADMIN_STATES_UTS)

  const handleSubmit = async () => {
    if (!isFormValid) return

    setIsSubmitting(true)
    try {
      const tenant = await createTenantMutation.mutateAsync({
        stateCode,
        name: stateName.trim(),
      })

      try {
        await inviteUserMutation.mutateAsync({
          email: adminEmail.trim(),
          role: 'STATE_ADMIN',
          tenantCode: tenant.stateCode,
        })
        toast.addToast(t('statesUts.messages.inviteSent'), 'success')
        setTimeout(() => {
          navigate(ROUTES.SUPER_ADMIN_STATES_UTS_VIEW.replace(':id', String(tenant.id)))
        }, 1000)
      } catch (adminError) {
        console.error('Admin invite failed:', adminError)
        toast.addToast(t('statesUts.messages.tenantCreatedAdminFailed'), 'error')
      }
    } catch (error) {
      console.error('Failed to create tenant:', error)
      toast.addToast(t('statesUts.messages.failedToAdd'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPending = isSubmitting || createTenantMutation.isPending || inviteUserMutation.isPending

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
        as="form"
        role="form"
        aria-label={t('statesUts.addTitle')}
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

            {/* State Admin Invite */}
            <Heading as="h2" size="h3" fontWeight="400" mb={4} id="admin-details-heading">
              {t('statesUts.adminDetails.title')}
            </Heading>
            <SimpleGrid
              columns={{ base: 1, lg: 2 }}
              spacing={6}
              aria-labelledby="admin-details-heading"
            >
              <FormControl isRequired isInvalid={emailError}>
                <FormLabel textStyle="h10" mb={1}>
                  {t('statesUts.adminDetails.email')}
                </FormLabel>
                <Input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
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
              onClick={handleCancel}
              isDisabled={isPending}
            >
              {t('common:button.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              width={{ base: 'full', sm: 'auto' }}
              maxWidth={{ base: '100%', sm: '275px' }}
              isLoading={isPending}
              isDisabled={!isFormValid || isPending}
            >
              {t('statesUts.buttons.addAndSendLink')}
            </Button>
          </HStack>
        </Flex>
      </Box>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
