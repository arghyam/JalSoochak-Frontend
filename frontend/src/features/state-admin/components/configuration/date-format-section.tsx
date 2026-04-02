import { Box, Text, VStack, Flex } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { IoInformation } from 'react-icons/io5'
import { SearchableSelect, ActionTooltip } from '@/shared/components/common'
import type { DateFormatConfig } from '../../types/configuration'

const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
  { value: 'DD/MM/YY', label: 'DD/MM/YY' },
  { value: 'MM/DD/YY', label: 'MM/DD/YY' },
]

const TIME_FORMAT_OPTIONS = [
  { value: 'HH:mm', label: '24-hour (HH:mm)' },
  { value: 'hh:mm a', label: '12-hour (hh:mm a)' },
]

interface DateFormatSectionProps {
  title: string
  infoTooltip?: string
  value: DateFormatConfig
  onChange: (value: DateFormatConfig) => void
}

export function DateFormatSection({ title, infoTooltip, value, onChange }: DateFormatSectionProps) {
  const { t } = useTranslation('state-admin')

  const timezoneOptions = useMemo(
    () =>
      Intl.supportedValuesOf('timeZone').map((tz) => ({
        value: tz,
        label: tz,
      })),
    []
  )

  return (
    <Box>
      <Flex align="center" gap={1} mb={3}>
        <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950">
          {title}
        </Text>
        {infoTooltip && (
          <ActionTooltip label={infoTooltip}>
            <Flex
              as="span"
              align="center"
              color="neutral.400"
              cursor="default"
              _hover={{ color: 'primary.500' }}
            >
              <IoInformation size={16} aria-label={infoTooltip} />
            </Flex>
          </ActionTooltip>
        )}
      </Flex>
      <VStack spacing={3} align="stretch">
        <Box>
          <Text fontSize="xs" color="neutral.600" mb={1}>
            {t('configuration.sections.dateFormat.dateFormat')}
          </Text>
          <SearchableSelect
            options={DATE_FORMAT_OPTIONS}
            value={value.dateFormat ?? ''}
            onChange={(v) => onChange({ ...value, dateFormat: v || null })}
            placeholder={t('configuration.sections.dateFormat.datePlaceholder')}
            width={{ base: 'full', xl: '486px' }}
            height="36px"
            borderRadius="6px"
            borderColor="neutral.300"
            fontSize="sm"
            ariaLabel={t('configuration.sections.dateFormat.dateFormat')}
          />
        </Box>

        <Box>
          <Text fontSize="xs" color="neutral.600" mb={1}>
            {t('configuration.sections.dateFormat.timeFormat')}
          </Text>
          <SearchableSelect
            options={TIME_FORMAT_OPTIONS}
            value={value.timeFormat ?? ''}
            onChange={(v) => onChange({ ...value, timeFormat: v || null })}
            placeholder={t('configuration.sections.dateFormat.timePlaceholder')}
            width={{ base: 'full', xl: '486px' }}
            height="36px"
            borderRadius="6px"
            borderColor="neutral.300"
            fontSize="sm"
            ariaLabel={t('configuration.sections.dateFormat.timeFormat')}
          />
        </Box>

        <Box>
          <Text fontSize="xs" color="neutral.600" mb={1}>
            {t('configuration.sections.dateFormat.timezone')}
          </Text>
          <SearchableSelect
            options={timezoneOptions}
            value={value.timezone ?? ''}
            onChange={(tz) => onChange({ ...value, timezone: tz || null })}
            placeholder={t('configuration.sections.dateFormat.timezonePlaceholder')}
            width={{ base: 'full', xl: '486px' }}
            height="36px"
            borderRadius="6px"
            borderColor="neutral.300"
            fontSize="sm"
            ariaLabel={t('configuration.sections.dateFormat.timezone')}
          />
        </Box>
      </VStack>
    </Box>
  )
}
