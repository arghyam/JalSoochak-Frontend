import {
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { WarningTwoIcon } from '@chakra-ui/icons'
import { useTranslation } from 'react-i18next'
import { ActionTooltip, RequiredIndicator } from '@/shared/components/common'
import { FieldInfoIcon } from './configuration-view-mode'
import {
  CHANNEL_CODE_TO_NAME,
  type KnownSupportedChannel,
  type SupportedChannel,
} from '../../types/configuration'

interface ChannelsSectionProps {
  allDisplayChannels: SupportedChannel[]
  halfChannels: number
  selectedChannels: SupportedChannel[]
  errors: Record<string, string>
  required: boolean
  isLoading: boolean
  isError: boolean
  degraded: boolean
  removedChannels: SupportedChannel[]
  onChange: (channels: SupportedChannel[]) => void
  onClearError: (key: string) => void
}

export function ChannelsSection({
  allDisplayChannels,
  halfChannels,
  selectedChannels,
  errors,
  required,
  isLoading,
  isError,
  degraded,
  removedChannels,
  onChange,
  onClearError,
}: ChannelsSectionProps) {
  const { t } = useTranslation(['state-admin', 'common'])

  const handleChange = (values: string[]) => {
    onChange(values as SupportedChannel[])
    onClearError('supportedChannels')
  }

  function renderChannel(code: SupportedChannel) {
    const isRemoved = degraded && removedChannels.includes(code)
    return (
      <HStack key={code} spacing={1} align="center">
        <Checkbox value={code} isDisabled={isRemoved}>
          <Text fontSize="sm" color={isRemoved ? 'neutral.400' : 'neutral.950'}>
            {CHANNEL_CODE_TO_NAME[code as KnownSupportedChannel] ?? code}
          </Text>
        </Checkbox>
        {isRemoved && (
          <ActionTooltip label={t('configuration.sections.supportedChannels.degradedTooltip')}>
            <WarningTwoIcon
              color="error.500"
              boxSize={3}
              aria-label={t('configuration.sections.supportedChannels.degradedTooltip')}
            />
          </ActionTooltip>
        )}
      </HStack>
    )
  }

  return (
    <FormControl id="config-field-supported-channels" isInvalid={!!errors.supportedChannels}>
      <Flex align="center" gap={1} mb={3}>
        <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950">
          {t('configuration.sections.supportedChannels.title')}
          <RequiredIndicator required={required} />
        </Text>
        <FieldInfoIcon tooltip={t('configuration.infoText.supportedChannels')} />
      </Flex>
      {isLoading ? (
        <Flex align="center" gap={2}>
          <Spinner size="sm" color="primary.500" />
          <Text fontSize="sm" color="neutral.600">
            {t('common:loading')}
          </Text>
        </Flex>
      ) : (
        <>
          {isError && (
            <Text fontSize="sm" color="error.500" mb={2}>
              {t('common:toast.failedToLoad')}
            </Text>
          )}
          <CheckboxGroup value={selectedChannels} onChange={handleChange}>
            <SimpleGrid columns={2} spacing={3} w={{ base: 'full', md: '400px' }}>
              <VStack align="start" spacing={3}>
                {allDisplayChannels.slice(0, halfChannels).map(renderChannel)}
              </VStack>
              <VStack align="start" spacing={3}>
                {allDisplayChannels.slice(halfChannels).map(renderChannel)}
              </VStack>
            </SimpleGrid>
          </CheckboxGroup>
        </>
      )}
      <FormErrorMessage>{errors.supportedChannels}</FormErrorMessage>
    </FormControl>
  )
}
