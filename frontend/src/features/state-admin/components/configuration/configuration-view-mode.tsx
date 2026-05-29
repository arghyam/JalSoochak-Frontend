import React from 'react'
import { Box, Flex, SimpleGrid, Spinner, Text, VStack } from '@chakra-ui/react'
import { AiOutlineInfoCircle } from 'react-icons/ai'
import { useTranslation } from 'react-i18next'
import { ActionTooltip } from '@/shared/components/common'
import { useConfigurationQuery } from '../../services/query/use-state-admin-queries'
import { CHANNEL_CODE_TO_NAME, type KnownSupportedChannel } from '../../types/configuration'

interface ViewModeProps {
  config: NonNullable<ReturnType<typeof useConfigurationQuery>['data']>
  logoUrl: string | undefined
  isLogoLoading: boolean
  isLogoError: boolean
  notFound: boolean
  t: ReturnType<typeof useTranslation<['state-admin', 'common']>>['t']
  lgdLevelCount: number
  deptLevelCount: number
}

export function FieldInfoIcon({ tooltip }: { tooltip: string }) {
  return (
    <ActionTooltip label={tooltip}>
      <Flex
        as="span"
        align="center"
        color="neutral.400"
        cursor="default"
        _hover={{ color: 'primary.500' }}
      >
        <AiOutlineInfoCircle size={16} aria-label={tooltip} />
      </Flex>
    </ActionTooltip>
  )
}

function ViewField({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box>
      <Text
        fontSize={{ base: 'xs', md: 'sm' }}
        fontWeight="medium"
        color={color ?? 'neutral.950'}
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize={{ base: 'xs', md: 'sm' }} color="neutral.950">
        {value || '-'}
      </Text>
    </Box>
  )
}

function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" color="neutral.950" mb={3}>
        {title}
      </Text>
      {children}
    </Box>
  )
}

export function ViewMode({
  config,
  logoUrl,
  isLogoLoading,
  isLogoError,
  notFound,
  t,
  lgdLevelCount,
  deptLevelCount,
}: ViewModeProps) {
  return (
    <VStack spacing={6} align="stretch">
      {/* Supported Channels */}
      <ViewSection title={t('configuration.sections.supportedChannels.title')}>
        <Text fontSize="sm" color="neutral.950">
          {config.supportedChannels.length > 0
            ? config.supportedChannels
                .map((c) => CHANNEL_CODE_TO_NAME[c as KnownSupportedChannel] ?? c)
                .join(', ')
            : '-'}
        </Text>
      </ViewSection>

      {/* Meter Change Reasons — 2-column grid */}
      <ViewSection title={t('configuration.sections.meterChangeReasons.title')}>
        {config.meterChangeReasons.length > 0 ? (
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
            {config.meterChangeReasons.map((r) => (
              <Text key={r.id} fontSize="sm" color="neutral.950">
                {r.name}
              </Text>
            ))}
          </SimpleGrid>
        ) : (
          <Text fontSize="sm" color="neutral.500">
            -
          </Text>
        )}
      </ViewSection>

      {/* Supply Outage Reasons — 2-column grid */}
      <ViewSection title={t('configuration.sections.supplyOutageReasons.title')}>
        {config.supplyOutageReasons.length > 0 ? (
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
            {config.supplyOutageReasons.map((r) => (
              <Text key={r.id} fontSize="sm" color="neutral.950">
                {r.name}
              </Text>
            ))}
          </SimpleGrid>
        ) : (
          <Text fontSize="sm" color="neutral.500">
            -
          </Text>
        )}
      </ViewSection>

      {/* Record Location */}
      <ViewField
        label={t('configuration.sections.locationCheckRequired.title')}
        value={
          config.locationCheckRequired
            ? t('configuration.sections.locationCheckRequired.yes')
            : t('configuration.sections.locationCheckRequired.no')
        }
        color="neutral.950"
      />

      {/* LGD Map Levels */}
      {lgdLevelCount > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="600" color="neutral.950" mb={3}>
            {t('configuration.sections.lgdMapLevels.title')}
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {Array.from({ length: lgdLevelCount }).map((_, i) => (
              <ViewField
                key={`view-lgd-level-${i + 1}`}
                label={t('configuration.sections.lgdMapLevels.displayLevelLabel', {
                  level: i + 1,
                })}
                value={
                  config.displayMapLgdLevels[i]
                    ? t('yes', { ns: 'common' })
                    : t('no', { ns: 'common' })
                }
                color="neutral.950"
              />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Department Map Levels */}
      {deptLevelCount > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="600" color="neutral.950" mb={3}>
            {t('configuration.sections.departmentMapLevels.title')}
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {Array.from({ length: deptLevelCount }).map((_, i) => (
              <ViewField
                key={`view-dept-level-${i + 1}`}
                label={t('configuration.sections.departmentMapLevels.displayLevelLabel', {
                  level: i + 1,
                })}
                value={
                  config.displayDepartmentMapLevels[i]
                    ? t('yes', { ns: 'common' })
                    : t('no', { ns: 'common' })
                }
                color="neutral.950"
              />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Data Consolidation Time + Pump Operator Reminder Nudge Time */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <ViewField
          label={t('configuration.sections.dataConsolidationTime.title')}
          value={config.dataConsolidationTime}
          color="neutral.950"
        />
        <ViewField
          label={t('configuration.sections.pumpOperatorReminderNudgeTime.title')}
          value={config.pumpOperatorReminderNudgeTime}
          color="neutral.950"
        />
      </SimpleGrid>

      {/* Screen Date Format + Table Date Format */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <ViewSection title={t('configuration.sections.dateFormatScreen.title')}>
          <Text fontSize="sm" color="neutral.950">
            {config.dateFormatScreen.dateFormat ?? '-'}
          </Text>
          {/* Kept for future integration if needed */}
          {/* <Text fontSize="sm" color="neutral.950">
            {t('configuration.sections.dateFormat.timeFormat')}:{' '}
            {config.dateFormatScreen.timeFormat ?? '-'}
          </Text>
          <Text fontSize="sm" color="neutral.950">
            {t('configuration.sections.dateFormat.timezone')}:{' '}
            {config.dateFormatScreen.timezone ?? '-'}
          </Text> */}
        </ViewSection>
        <ViewSection title={t('configuration.sections.dateFormatTable.title')}>
          <Text fontSize="sm" color="neutral.950">
            {config.dateFormatTable.dateFormat ?? '-'}
          </Text>
          {/* Kept for future integration if needed */}
          {/* <Text fontSize="sm" color="neutral.950">
            {t('configuration.sections.dateFormat.timeFormat')}:{' '}
            {config.dateFormatTable.timeFormat ?? '-'}
          </Text>
          <Text fontSize="sm" color="neutral.950">
            {t('configuration.sections.dateFormat.timezone')}:{' '}
            {config.dateFormatTable.timezone ?? '-'}
          </Text> */}
        </ViewSection>
      </SimpleGrid>

      {/* Average Members Per Household */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <ViewField
          label={t('configuration.sections.averageMembersPerHousehold.title')}
          value={
            config.averageMembersPerHousehold > 0 ? String(config.averageMembersPerHousehold) : '-'
          }
          color="neutral.950"
        />
      </SimpleGrid>

      {/* Logo (last) */}
      <ViewSection title={t('configuration.sections.logo.title')}>
        {isLogoLoading ? (
          <Spinner size="sm" color="primary.500" aria-label="Loading logo" />
        ) : isLogoError && !notFound ? (
          <Text fontSize="sm" color="error.500">
            {t('toast.failedToLoad', { ns: 'common' })}
          </Text>
        ) : logoUrl ? (
          <Box
            as="img"
            src={logoUrl}
            alt={t('configuration.sections.logo.currentLogo')}
            h="48px"
            objectFit="contain"
          />
        ) : (
          <Text fontSize="sm" color="neutral.500">
            -
          </Text>
        )}
      </ViewSection>
    </VStack>
  )
}
