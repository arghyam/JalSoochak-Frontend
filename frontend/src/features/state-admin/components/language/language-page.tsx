import { useState, useEffect } from 'react'
import { Box, Text, Button, Flex, HStack, Heading, Spinner, SimpleGrid } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { EditIcon } from '@chakra-ui/icons'
import { AVAILABLE_LANGUAGES } from '../../types/language'
import { useToast } from '@/shared/hooks/use-toast'
import { ToastContainer, SearchableSelect } from '@/shared/components/common'
import {
  useLanguageConfigurationQuery,
  useSaveLanguageConfigurationMutation,
} from '../../services/query/use-state-admin-queries'

export function LanguagePage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { data: config, isLoading, isError } = useLanguageConfigurationQuery()
  const saveLanguageConfigMutation = useSaveLanguageConfigurationMutation()
  const [isEditing, setIsEditing] = useState(false)
  const [languageDraft, setLanguageDraft] = useState<{
    primaryLanguage?: string
    secondaryLanguage?: string
    tertiaryLanguage?: string
  }>({})
  const toast = useToast()

  useEffect(() => {
    document.title = `${t('language.title')} | JalSoochak`
  }, [t])

  const effectiveIsEditing = isEditing || Boolean(config && !config.isConfigured)
  const primaryLanguage = languageDraft.primaryLanguage ?? config?.primaryLanguage ?? ''
  const secondaryLanguage = languageDraft.secondaryLanguage ?? config?.secondaryLanguage ?? ''
  const tertiaryLanguage = languageDraft.tertiaryLanguage ?? config?.tertiaryLanguage ?? ''

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setLanguageDraft({})
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!primaryLanguage) {
      return
    }

    try {
      await saveLanguageConfigMutation.mutateAsync({
        primaryLanguage,
        secondaryLanguage: secondaryLanguage || undefined,
        tertiaryLanguage: tertiaryLanguage || undefined,
        isConfigured: true,
      })
      setIsEditing(false)
      toast.addToast(t('common:toast.changesSavedShort'), 'success')
    } catch (error) {
      console.error('Failed to save language configuration:', error)
      toast.addToast(t('common:toast.failedToSave'), 'error')
    }
  }

  const getPrimaryLanguageLabel = () => {
    const lang = AVAILABLE_LANGUAGES.find((l) => l.value === primaryLanguage)
    return lang ? lang.label : primaryLanguage
  }

  const getSecondaryLanguageLabel = () => {
    if (!secondaryLanguage) return ''
    const lang = AVAILABLE_LANGUAGES.find((l) => l.value === secondaryLanguage)
    return lang ? lang.label : secondaryLanguage
  }

  const getTertiaryLanguageLabel = () => {
    if (!tertiaryLanguage) return ''
    const lang = AVAILABLE_LANGUAGES.find((l) => l.value === tertiaryLanguage)
    return lang ? lang.label : tertiaryLanguage
  }

  if (isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('language.title')}
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
          {t('language.title')}
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
          {t('language.title')}
        </Heading>
      </Box>

      {/* Language Configuration Card */}
      <Box
        as="section"
        aria-labelledby="language-config-heading"
        bg="white"
        borderWidth="0.5px"
        borderColor="neutral.100"
        borderRadius={{ base: 'lg', md: 'xl' }}
        w="full"
        minH={{ base: 'auto', lg: 'calc(100vh - 148px)' }}
        py={{ base: 4, md: 6 }}
        px={4}
      >
        <Flex direction="column" w="full" h="full" justify="space-between">
          {/* Card Header */}
          <Flex justify="space-between" align="center" mb={4}>
            <Heading
              as="h2"
              id="language-config-heading"
              size="h3"
              textStyle="h8"
              fontWeight="400"
              fontSize={{ base: 'md', md: 'xl' }}
            >
              {t('language.configuration')}
            </Heading>
            {config?.isConfigured && !effectiveIsEditing && (
              <Button
                variant="ghost"
                h={6}
                w={6}
                minW={6}
                pl="2px"
                pr="2px"
                onClick={handleEdit}
                color="neutral.950"
                _hover={{ bg: 'primary.50', color: 'primary.500' }}
                aria-label={t('language.aria.editConfiguration')}
              >
                <EditIcon h={5} w={5} aria-hidden="true" />
              </Button>
            )}
          </Flex>

          {/* View Mode */}
          {!effectiveIsEditing && config?.isConfigured ? (
            <Box w="full" h="full" minH={{ base: 'auto', lg: 'calc(100vh - 250px)' }}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 6 }} mb={4}>
                <Box>
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.700"
                    mb={1}
                  >
                    {t('language.primaryLanguage')}
                  </Text>
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
                    {getPrimaryLanguageLabel()}
                  </Text>
                </Box>
                <Box>
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.700"
                    mb={1}
                  >
                    {t('language.secondaryLanguage')}
                  </Text>
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
                    {getSecondaryLanguageLabel() || '-'}
                  </Text>
                </Box>
                <Box>
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.700"
                    mb={1}
                  >
                    {t('language.tertiaryLanguage')}
                  </Text>
                  <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
                    {getTertiaryLanguageLabel() || '-'}
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>
          ) : (
            /* Edit Mode */
            <Flex
              as="form"
              role="form"
              aria-label={t('language.configuration')}
              direction="column"
              w="full"
              h="full"
              justify="space-between"
              minH={{ base: 'auto', lg: 'calc(100vh - 250px)' }}
              gap={{ base: 6, lg: 0 }}
            >
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                <Box w={{ base: 'full', xl: '486px' }}>
                  <Text
                    as="label"
                    id="primary-language-label"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.950"
                    mb={1}
                    display="block"
                  >
                    {t('language.primaryLanguage')}
                    <Text as="span" color="error.500" ml={1}>
                      *
                    </Text>
                  </Text>
                  <SearchableSelect
                    options={AVAILABLE_LANGUAGES}
                    value={primaryLanguage}
                    onChange={(value) =>
                      setLanguageDraft((prev) => ({ ...prev, primaryLanguage: value }))
                    }
                    placeholder={t('common:select')}
                    width="100%"
                    ariaLabel={t('language.aria.selectPrimaryLanguage')}
                  />
                </Box>
                <Box w={{ base: 'full', xl: '486px' }}>
                  <Text
                    as="label"
                    id="secondary-language-label"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.950"
                    mb={1}
                    display="block"
                  >
                    {t('language.secondaryLanguage')}
                  </Text>
                  <SearchableSelect
                    options={AVAILABLE_LANGUAGES}
                    value={secondaryLanguage}
                    onChange={(value) =>
                      setLanguageDraft((prev) => ({ ...prev, secondaryLanguage: value }))
                    }
                    placeholder={t('common:select')}
                    width="100%"
                    ariaLabel={t('language.aria.selectSecondaryLanguage')}
                  />
                </Box>
                <Box w={{ base: 'full', xl: '486px' }}>
                  <Text
                    as="label"
                    id="tertiary-language-label"
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="medium"
                    color="neutral.950"
                    mb={1}
                    display="block"
                  >
                    {t('language.tertiaryLanguage')}
                  </Text>
                  <SearchableSelect
                    options={AVAILABLE_LANGUAGES}
                    value={tertiaryLanguage}
                    onChange={(value) =>
                      setLanguageDraft((prev) => ({ ...prev, tertiaryLanguage: value }))
                    }
                    placeholder={t('common:select')}
                    width="100%"
                    ariaLabel={t('language.aria.selectTertiaryLanguage')}
                  />
                </Box>
              </SimpleGrid>

              {/* Action Buttons */}
              <HStack
                spacing={3}
                justify={{ base: 'stretch', sm: 'flex-end' }}
                flexDirection={{ base: 'column-reverse', sm: 'row' }}
                mt={{ base: 4, lg: 0 }}
              >
                <Button
                  variant="secondary"
                  size="md"
                  width={{ base: 'full', sm: '174px' }}
                  onClick={handleCancel}
                  isDisabled={saveLanguageConfigMutation.isPending}
                >
                  {t('common:button.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  width={{ base: 'full', sm: '174px' }}
                  onClick={handleSave}
                  isLoading={saveLanguageConfigMutation.isPending}
                  isDisabled={!primaryLanguage}
                >
                  {config?.isConfigured ? t('common:button.saveChanges') : t('common:button.save')}
                </Button>
              </HStack>
            </Flex>
          )}
        </Flex>
      </Box>

      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </Box>
  )
}
