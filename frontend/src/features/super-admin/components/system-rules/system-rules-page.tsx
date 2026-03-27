import { useState, useEffect } from 'react'
import { Box, Heading, Text, Button, Flex, HStack, SimpleGrid } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer, MetricNumberCard } from '@/shared/components/common'
import {
  useSaveSystemRulesConfigurationMutation,
  useSystemRulesConfigurationQuery,
} from '../../services/query/use-super-admin-queries'

export function SystemRulesPage() {
  const { t } = useTranslation(['super-admin', 'common'])

  useEffect(() => {
    document.title = `${t('systemRules.title')} | JalSoochak`
  }, [t])
  const { data: config, isLoading, isError } = useSystemRulesConfigurationQuery()
  const saveSystemRulesMutation = useSaveSystemRulesConfigurationMutation()

  const [formDraft, setFormDraft] = useState<{
    quantity?: string
    regularity?: string
  }>({})

  const toast = useToast()
  const quantity = formDraft.quantity ?? config?.quantity ?? ''
  const regularity = formDraft.regularity ?? config?.regularity ?? ''

  const handleCancel = () => {
    setFormDraft({})
  }

  const handleSave = async () => {
    if (!quantity || !regularity) {
      toast.addToast(t('common:toast.fillAllFields'), 'error')
      return
    }

    try {
      await saveSystemRulesMutation.mutateAsync({
        coverage: config?.coverage ?? '',
        continuity: config?.continuity ?? '',
        quantity,
        regularity,
        isConfigured: true,
      })
      toast.addToast(t('common:toast.changesSaved'), 'success')
    } catch (error) {
      console.error('Failed to save system rules configuration:', error)
      toast.addToast(t('common:toast.failedToSave'), 'error')
    }
  }

  const hasChanges = config && (quantity !== config.quantity || regularity !== config.regularity)

  const isFormValid = Boolean(quantity && regularity)

  if (isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('systemRules.title')}
        </Heading>
        <Flex role="status" aria-live="polite" align="center" justify="center" minH="200px">
          <Text color="neutral.600">{t('common:loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (isError || !config) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={5}>
          {t('systemRules.title')}
        </Heading>
        <Text color="error.500">{t('common:toast.failedToLoad')}</Text>
      </Box>
    )
  }

  return (
    <Box w="full">
      {/* Page Header */}
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('systemRules.title')}
        </Heading>
      </Box>

      {/* Configuration Card */}
      <Box
        as="form"
        role="form"
        aria-label={t('systemRules.configurationSettings')}
        bg="white"
        borderWidth="0.5px"
        borderColor="neutral.200"
        borderRadius="12px"
        w="full"
        minH={{ base: 'auto', lg: 'calc(100vh - 148px)' }}
        py={6}
        px={{ base: 3, md: 4 }}
      >
        <Flex
          direction="column"
          w="full"
          h="full"
          justify="space-between"
          minH={{ base: 'auto', lg: 'calc(100vh - 200px)' }}
        >
          <Flex direction="column" gap={4}>
            {/* Card Header */}
            <Heading as="h2" size="h3" fontWeight="400">
              {t('systemRules.configurationSettings')}
            </Heading>

            {/* Form Fields Grid - Responsive Layout */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={7}>
              <MetricNumberCard
                title={t('systemRules.quantity.title')}
                description={t('systemRules.quantity.description')}
                value={quantity}
                onChange={(valueString) =>
                  setFormDraft((prev) => ({ ...prev, quantity: valueString }))
                }
                placeholder={t('common:enter')}
                descriptionId="quantity-description"
              />
              <MetricNumberCard
                title={t('systemRules.regularity.title')}
                description={t('systemRules.regularity.description')}
                value={regularity}
                onChange={(valueString) =>
                  setFormDraft((prev) => ({ ...prev, regularity: valueString }))
                }
                placeholder={t('common:enter')}
                descriptionId="regularity-description"
              />
            </SimpleGrid>
          </Flex>

          {/* Action Buttons */}
          <HStack
            spacing={3}
            justify={{ base: 'stretch', sm: 'flex-end' }}
            mt={6}
            flexDirection={{ base: 'column', sm: 'row' }}
          >
            <Button
              variant="secondary"
              size="md"
              width={{ base: 'full', sm: '174px' }}
              onClick={handleCancel}
              isDisabled={saveSystemRulesMutation.isPending || !hasChanges}
            >
              {t('common:button.cancel')}
            </Button>
            <Button
              variant="primary"
              size="md"
              width={{ base: 'full', sm: '174px' }}
              onClick={handleSave}
              isLoading={saveSystemRulesMutation.isPending}
              isDisabled={!isFormValid || !hasChanges}
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
