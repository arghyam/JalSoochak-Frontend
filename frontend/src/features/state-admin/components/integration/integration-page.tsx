import { useState, useEffect } from 'react'
import {
  Box,
  Text,
  Button,
  Flex,
  Input,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Heading,
  Spinner,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer } from '@/shared/components/common'
import {
  useIntegrationConfigurationQuery,
  useSaveIntegrationConfigurationMutation,
} from '../../services/query/use-state-admin-queries'

export function IntegrationPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { data: config, isLoading, isError } = useIntegrationConfigurationQuery()
  const saveIntegrationMutation = useSaveIntegrationConfigurationMutation()

  const [formValues, setFormValues] = useState<{
    apiUrl?: string
    apiKey?: string
    organizationId?: string
  }>({})

  const toast = useToast()

  useEffect(() => {
    document.title = `${t('integration.title')} | JalSoochak`
  }, [t])

  const apiUrl = formValues.apiUrl ?? config?.apiUrl ?? ''
  const apiKey = formValues.apiKey ?? config?.apiKey ?? ''
  const organizationId = formValues.organizationId ?? config?.organizationId ?? ''

  const handleCancel = () => {
    setFormValues({})
  }

  const handleSave = async () => {
    if (!apiUrl || !apiKey || !organizationId) {
      toast.addToast(t('common:toast.fillAllFields'), 'error')
      return
    }

    try {
      await saveIntegrationMutation.mutateAsync({ apiUrl, apiKey, organizationId })
      toast.addToast(t('common:toast.changesSavedShort'), 'success')
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
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('integration.title')}
        </Heading>
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
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('integration.title')}
        </Heading>
        <Text color="error.500">{t('integration.messages.failedToLoad')}</Text>
      </Box>
    )
  }

  return (
    <Box w="full">
      {/* Page Header */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('integration.title')}
        </Heading>
      </Box>

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
              <FormControl isRequired>
                <FormLabel textStyle="h10" fontSize={{ base: 'xs', md: 'sm' }} mb={1}>
                  {t('integration.fields.apiUrl')}
                </FormLabel>
                <Input
                  placeholder={t('integration.fields.apiUrlPlaceholder')}
                  fontSize="14px"
                  fontWeight="400"
                  value={apiUrl}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, apiUrl: e.target.value }))}
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
              </FormControl>

              <FormControl isRequired>
                <FormLabel textStyle="h10" fontSize={{ base: 'xs', md: 'sm' }} mb={1}>
                  {t('integration.fields.apiKey')}
                </FormLabel>
                <Input
                  placeholder={t('common:enter')}
                  fontSize="14px"
                  fontWeight="400"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, apiKey: e.target.value }))}
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
              </FormControl>

              <FormControl isRequired>
                <FormLabel textStyle="h10" fontSize={{ base: 'xs', md: 'sm' }} mb={1}>
                  {t('integration.fields.organizationId')}
                </FormLabel>
                <Input
                  placeholder={t('common:enter')}
                  fontSize="14px"
                  fontWeight="400"
                  value={organizationId}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, organizationId: e.target.value }))
                  }
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
              onClick={handleSave}
              isLoading={saveIntegrationMutation.isPending}
              isDisabled={!apiUrl || !apiKey || !organizationId || !hasChanges}
            >
              {t('common:button.save')}
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
