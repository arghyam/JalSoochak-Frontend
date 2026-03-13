import { useState, useEffect } from 'react'
import {
  Box,
  Text,
  Flex,
  Heading,
  Spinner,
  OrderedList,
  ListItem,
  Textarea,
  Stack,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { SearchableSelect } from '@/shared/components/common'
import { getLocaleByLabel } from '@/shared/constants/languages'
import { useMessageTemplatesQuery } from '../../services/query/use-state-admin-queries'
import type { LanguageCode, ScreenName } from '../../types/message-templates'
import { SCREEN_NAMES } from '../../types/message-templates'

export function MessageTemplatesPage() {
  const { t } = useTranslation(['state-admin', 'common'])
  const { data, isLoading, isError } = useMessageTemplatesQuery()

  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [selectedScreen, setSelectedScreen] = useState<ScreenName | ''>('')

  useEffect(() => {
    document.title = `${t('messageTemplates.title')} | JalSoochak`
  }, [t])

  // Reset screen selection when language changes
  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value)
    setSelectedScreen('')
  }

  const languageOptions =
    data?.supportedLanguages
      .slice()
      .sort((a, b) => a.preference - b.preference)
      .map((l) => ({ value: l.language, label: l.language })) ?? []

  const screenOptions = SCREEN_NAMES.map((name) => ({
    value: name,
    label: t(`messageTemplates.screens.${name}`),
  }))

  const localeCode = selectedLanguage ? getLocaleByLabel(selectedLanguage) : undefined
  const screenContent =
    selectedScreen && data?.screens[selectedScreen as ScreenName]
      ? data.screens[selectedScreen as ScreenName]!
      : null

  const getLocalizedText = (
    map: Record<LanguageCode, string | null> | null | undefined,
    code: string
  ): string | null => {
    if (!map) return null
    return (map as Record<string, string | null>)[code] ?? null
  }

  const getSortedItems = (
    items: Record<string, { order: number; label: Record<LanguageCode, string | null> }> | null
  ): { key: string; text: string }[] => {
    if (!items || !localeCode) return []
    return Object.entries(items)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key, item]) => ({
        key,
        text: getLocalizedText(item.label, localeCode) ?? '',
      }))
      .filter((item) => item.text !== '')
  }

  const hasContent =
    localeCode &&
    screenContent &&
    (getLocalizedText(screenContent.prompt, localeCode) !== null ||
      getLocalizedText(screenContent.message, localeCode) !== null ||
      getLocalizedText(screenContent.confirmationTemplate, localeCode) !== null ||
      getSortedItems(screenContent.options).length > 0 ||
      getSortedItems(screenContent.reasons).length > 0)

  if (isLoading) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('messageTemplates.title')}
        </Heading>
        <Flex align="center" role="status" aria-live="polite" aria-busy="true">
          <Spinner size="md" color="primary.500" mr={3} />
          <Text color="neutral.600">{t('common:loading')}</Text>
        </Flex>
      </Box>
    )
  }

  if (isError) {
    return (
      <Box w="full">
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }} mb={6}>
          {t('messageTemplates.title')}
        </Heading>
        <Text color="error.500">{t('messageTemplates.messages.failedToLoad')}</Text>
      </Box>
    )
  }

  return (
    <Box w="full">
      <Box mb={5}>
        <Heading as="h1" size={{ base: 'h2', md: 'h1' }}>
          {t('messageTemplates.title')}
        </Heading>
      </Box>

      <Box
        as="section"
        aria-label={t('messageTemplates.title')}
        bg="white"
        borderWidth="0.5px"
        borderColor="neutral.100"
        borderRadius={{ base: 'lg', md: 'xl' }}
        w="full"
        minH={{ base: 'auto', lg: 'calc(100vh - 148px)' }}
        py={{ base: 4, md: 6 }}
        px={4}
      >
        {/* Filters Row */}
        <Flex gap={4} direction={{ base: 'column', md: 'row' }} mb={6} wrap="wrap">
          {/* Language Select */}
          <Box w={{ base: 'full', md: '240px' }}>
            <Text
              as="label"
              textStyle="h10"
              fontSize={{ base: 'xs', md: 'sm' }}
              mb={1}
              display="block"
            >
              {t('messageTemplates.language')}
              <Text as="span" color="error.500" ml={1}>
                *
              </Text>
            </Text>
            <SearchableSelect
              options={languageOptions}
              value={selectedLanguage}
              onChange={handleLanguageChange}
              placeholder={t('messageTemplates.selectLanguage')}
              width="full"
              textStyle="h10"
              borderColor="neutral.300"
              borderRadius="4px"
              ariaLabel={t('messageTemplates.aria.selectLanguage')}
            />
          </Box>

          {/* Template Select */}
          <Box w={{ base: 'full', md: '240px' }}>
            <Text
              as="label"
              textStyle="h10"
              fontSize={{ base: 'xs', md: 'sm' }}
              mb={1}
              display="block"
            >
              {t('messageTemplates.template')}
              <Text as="span" color="error.500" ml={1}>
                *
              </Text>
            </Text>
            <SearchableSelect
              options={screenOptions}
              value={selectedScreen}
              onChange={(value) => setSelectedScreen(value as ScreenName)}
              placeholder={t('messageTemplates.selectTemplate')}
              width="full"
              textStyle="h10"
              borderColor="neutral.300"
              borderRadius="4px"
              disabled={!selectedLanguage}
              ariaLabel={t('messageTemplates.aria.selectTemplate')}
            />
          </Box>
        </Flex>

        {/* Content Panel */}
        {selectedLanguage && selectedScreen && (
          <Box>
            {!hasContent ? (
              <Text color="neutral.500" fontSize={{ base: 'xs', md: 'sm' }}>
                {t('messageTemplates.noContent')}
              </Text>
            ) : (
              <Stack spacing={5} maxW={{ base: 'full', xl: '600px' }}>
                {/* Prompt */}
                {localeCode && getLocalizedText(screenContent?.prompt, localeCode) !== null && (
                  <TemplateField
                    label={t('messageTemplates.prompt')}
                    value={getLocalizedText(screenContent!.prompt, localeCode)!}
                  />
                )}

                {/* Message */}
                {localeCode && getLocalizedText(screenContent?.message, localeCode) !== null && (
                  <TemplateField
                    label={t('messageTemplates.message')}
                    value={getLocalizedText(screenContent!.message, localeCode)!}
                  />
                )}

                {/* Confirmation Template */}
                {localeCode &&
                  getLocalizedText(screenContent?.confirmationTemplate, localeCode) !== null && (
                    <TemplateField
                      label={t('messageTemplates.confirmationTemplate')}
                      value={getLocalizedText(screenContent!.confirmationTemplate, localeCode)!}
                    />
                  )}

                {/* Options */}
                {getSortedItems(screenContent?.options ?? null).length > 0 && (
                  <Box>
                    <Text
                      textStyle="h10"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="600"
                      mb={2}
                    >
                      {t('messageTemplates.options')}
                    </Text>
                    <OrderedList spacing={1} pl={4}>
                      {getSortedItems(screenContent!.options).map((item) => (
                        <ListItem
                          key={item.key}
                          fontSize={{ base: '12px', md: '14px' }}
                          color="neutral.800"
                        >
                          {item.text}
                        </ListItem>
                      ))}
                    </OrderedList>
                  </Box>
                )}

                {/* Reasons */}
                {getSortedItems(screenContent?.reasons ?? null).length > 0 && (
                  <Box>
                    <Text
                      textStyle="h10"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="600"
                      mb={2}
                    >
                      {t('messageTemplates.reasons')}
                    </Text>
                    <OrderedList spacing={1} pl={4}>
                      {getSortedItems(screenContent!.reasons).map((item) => (
                        <ListItem
                          key={item.key}
                          fontSize={{ base: '12px', md: '14px' }}
                          color="neutral.800"
                        >
                          {item.text}
                        </ListItem>
                      ))}
                    </OrderedList>
                  </Box>
                )}
              </Stack>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

interface TemplateFieldProps {
  label: string
  value: string
}

function TemplateField({ label, value }: TemplateFieldProps) {
  return (
    <Box>
      <Text textStyle="h10" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="600" mb={1}>
        {label}
      </Text>
      <Textarea
        value={value}
        isReadOnly
        fontSize={{ base: '12px', md: '14px' }}
        fontWeight="400"
        height={{ base: '80px', md: '100px' }}
        borderColor="neutral.200"
        borderRadius="6px"
        resize="none"
        bg="neutral.50"
        _hover={{ borderColor: 'neutral.300' }}
        _focus={{ borderColor: 'neutral.300', boxShadow: 'none' }}
        sx={{
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      />
    </Box>
  )
}
