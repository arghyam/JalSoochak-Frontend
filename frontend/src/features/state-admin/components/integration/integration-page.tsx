import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Text,
  Button,
  Flex,
  Input,
  VStack,
  HStack,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Spinner,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer, PageHeader } from '@/shared/components/common'
import {
  useIntegrationConfigurationQuery,
  useSaveIntegrationConfigurationMutation,
} from '../../services/query/use-state-admin-queries'
import {
  isEmptyOrWhitespace,
  isValidHttpsUrl,
  hasHttpsOnce,
  exceedsMaxLength,
  validateTextField,
} from '@/shared/utils/validation'
import { ROUTES } from '@/shared/constants/routes'

const MAX_URL_LENGTH = 200
const MAX_API_KEY_LENGTH = 256
const MAX_ORG_ID_LENGTH = 100

function validateApiUrl(
  value: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string | null {
  if (isEmptyOrWhitespace(value)) return t('state-admin:validation.required')
  if (value.includes(' ')) return t('state-admin:validation.noSpaces')
  if (!hasHttpsOnce(value)) return t('state-admin:validation.httpsOnce')
  if (!isValidHttpsUrl(value)) return t('state-admin:validation.invalidUrl')
  if (exceedsMaxLength(value, MAX_URL_LENGTH))
    return t('state-admin:validation.maxLength', { max: MAX_URL_LENGTH })
  const textError = validateTextField(value)
  return textError ? t(`state-admin:validation.${textError}`) : null
}

function validateApiKey(
  value: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string | null {
  if (isEmptyOrWhitespace(value)) return t('state-admin:validation.required')
  if (exceedsMaxLength(value, MAX_API_KEY_LENGTH))
    return t('state-admin:validation.maxLength', { max: MAX_API_KEY_LENGTH })
  const textError = validateTextField(value)
  return textError ? t(`state-admin:validation.${textError}`) : null
}

function validateOrgId(
  value: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string | null {
  if (isEmptyOrWhitespace(value)) return t('state-admin:validation.required')
  if (exceedsMaxLength(value, MAX_ORG_ID_LENGTH))
    return t('state-admin:validation.maxLength', { max: MAX_ORG_ID_LENGTH })
  const textError = validateTextField(value)
  return textError ? t(`state-admin:validation.${textError}`) : null
}

export function IntegrationPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const navigate = useNavigate()
  const { data: config, isLoading, isError } = useIntegrationConfigurationQuery()
  const saveIntegrationMutation = useSaveIntegrationConfigurationMutation()

  const [formValues, setFormValues] = useState<{
    apiUrl?: string
    newApiKey?: string
    organizationId?: string
  }>({})

  const toast = useToast()
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    document.title = `${t('integration.title')} | JalSoochak`
  }, [t])

  const apiUrl = formValues.apiUrl ?? config?.apiUrl ?? ''
  const apiKey = formValues.newApiKey ?? config?.apiKey ?? ''
  const organizationId = formValues.organizationId ?? config?.organizationId ?? ''

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleCancel = () => {
    setFormValues({})
    setErrors({})
  }

  const validateForm = (): boolean => {
    const urlError = validateApiUrl(apiUrl, t)
    const keyError = validateApiKey(apiKey, t)
    const orgError = validateOrgId(organizationId, t)

    const newErrors: Record<string, string> = {}
    if (urlError) newErrors.apiUrl = urlError
    if (keyError) newErrors.apiKey = keyError
    if (orgError) newErrors.organizationId = orgError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (andNavigate = false) => {
    if (!validateForm()) return

    try {
      await saveIntegrationMutation.mutateAsync({ apiUrl, organizationId, apiKey })
      toast.addToast(t('common:toast.changesSavedShort'), 'success')
      if (andNavigate) navigate(ROUTES.STATE_ADMIN_ESCALATIONS)
    } catch (error) {
      console.error('Failed to save integration configuration:', error)
      toast.addToast(t('common:toast.failedToSave'), 'error')
    }
  }

  const hasChanges =
    config &&
    (apiUrl !== config.apiUrl ||
      apiKey !== config.apiKey ||
      organizationId !== config.organizationId)

  if (isLoading) {
    return (
      <Box w="full">
        <PageHeader mb={6}>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('integration.title')}
          </Heading>
        </PageHeader>
        <Flex align="center" role="status" aria-live="polite" aria-busy="true">
          <Spinner size="md" color="primary.500" mr={3} />
          <Text color="neutral.600">{t('common:loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (isError || !config) {
    return (
      <Box w="full">
        <PageHeader mb={6}>
          <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
            {t('integration.title')}
          </Heading>
        </PageHeader>
        <Text color="error.500">{t('integration.messages.failedToLoad')}</Text>
      </Box>
    )
  }

  return (
    <Box w="full">
      <PageHeader>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('integration.title')}
        </Heading>
      </PageHeader>

      {/* Integration Configuration Card */}
      <Box
        as="section"
        aria-labelledby="integration-heading"
        bg="white"
        borderWidth="0.5px"
        borderColor="neutral.100"
        borderRadius={{ base: 'lg', md: 'xl' }}
        w="full"
        minH={{ base: 'auto', lg: 'calc(100vh - 148px)' }}
        py={{ base: 4, md: 6 }}
        px={4}
      >
        <Flex
          as="form"
          role="form"
          aria-label={t('integration.aria.formLabel')}
          direction="column"
          w="full"
          h="full"
          justify="space-between"
          minH={{ base: 'auto', lg: 'calc(100vh - 200px)' }}
          gap={{ base: 6, lg: 0 }}
        >
          <Flex direction="column" gap={4}>
            <Heading
              as="h2"
              id="integration-heading"
              size="h3"
              fontWeight="400"
              fontSize={{ base: 'md', md: 'xl' }}
            >
              {t('integration.messageBrokerDetails')}
            </Heading>
            {/* Form Fields */}
            <VStack align="stretch" spacing={3} flex={1}>
              <FormControl isRequired isInvalid={!!errors.apiUrl}>
                <FormLabel textStyle="h10" fontSize={{ base: 'xs', md: 'sm' }} mb={1}>
                  {t('integration.fields.apiUrl')}
                </FormLabel>
                <Input
                  placeholder={t('integration.fields.apiUrlPlaceholder')}
                  fontSize="14px"
                  fontWeight="400"
                  value={apiUrl}
                  onChange={(e) => {
                    setFormValues((prev) => ({ ...prev, apiUrl: e.target.value }))
                    clearError('apiUrl')
                  }}
                  size="md"
                  h="36px"
                  maxW={{ base: '100%', lg: '486px' }}
                  px={3}
                  py={2}
                  borderColor="neutral.300"
                  borderRadius="4px"
                  aria-label={t('integration.aria.enterApiUrl')}
                  _hover={{ borderColor: 'neutral.400' }}
                  _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                />
                <FormErrorMessage>{errors.apiUrl}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.apiKey}>
                <FormLabel textStyle="h10" fontSize={{ base: 'xs', md: 'sm' }} mb={1}>
                  {t('integration.fields.apiKey')}
                </FormLabel>
                <Input
                  fontSize="14px"
                  fontWeight="400"
                  type="password"
                  value={apiKey}
                  placeholder={t('common:enter')}
                  onChange={(e) => {
                    setFormValues((prev) => ({ ...prev, newApiKey: e.target.value }))
                    clearError('apiKey')
                  }}
                  size="md"
                  h="36px"
                  maxW={{ base: '100%', lg: '486px' }}
                  px={3}
                  py={2}
                  borderColor="neutral.300"
                  borderRadius="4px"
                  aria-label={t('integration.aria.enterApiKey')}
                  _hover={{ borderColor: 'neutral.400' }}
                  _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                />
                <FormErrorMessage>{errors.apiKey}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.organizationId}>
                <FormLabel textStyle="h10" fontSize={{ base: 'xs', md: 'sm' }} mb={1}>
                  {t('integration.fields.organizationId')}
                </FormLabel>
                <Input
                  placeholder={t('common:enter')}
                  fontSize="14px"
                  fontWeight="400"
                  value={organizationId}
                  onChange={(e) => {
                    setFormValues((prev) => ({ ...prev, organizationId: e.target.value }))
                    clearError('organizationId')
                  }}
                  size="md"
                  h="36px"
                  maxW={{ base: '100%', lg: '486px' }}
                  px={3}
                  py={2}
                  borderColor="neutral.300"
                  borderRadius="4px"
                  aria-label={t('integration.aria.enterOrganizationId')}
                  _hover={{ borderColor: 'neutral.400' }}
                  _focus={{ borderColor: 'primary.500', boxShadow: 'none' }}
                />
                <FormErrorMessage>{errors.organizationId}</FormErrorMessage>
              </FormControl>
            </VStack>
          </Flex>

          {/* Action Buttons */}
          <HStack
            spacing={3}
            justify={{ base: 'stretch', sm: 'flex-end' }}
            flexDirection={{ base: 'column-reverse', sm: 'row' }}
            mt={4}
          >
            <Button
              variant="secondary"
              size="md"
              width={{ base: 'full', sm: '174px' }}
              onClick={handleCancel}
              isDisabled={saveIntegrationMutation.isPending}
            >
              {t('common:button.cancel')}
            </Button>
            <Button
              variant="primary"
              size="md"
              width={{ base: 'full', sm: '174px' }}
              onClick={() => handleSave(!config?.isConfigured)}
              isLoading={saveIntegrationMutation.isPending}
              isDisabled={saveIntegrationMutation.isPending || !hasChanges}
            >
              {config?.isConfigured
                ? t('common:button.saveChanges')
                : t('common:button.saveAndNext')}
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
