import { Box, Flex } from '@chakra-ui/react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

export type OutageTimeScaleKey = 'day' | 'week' | 'month'

const OUTAGE_TIME_SCALES: OutageTimeScaleKey[] = ['day', 'week', 'month']

export function getOutageTimeScaleXAxisLabel(
  timeScale: OutageTimeScaleKey | undefined,
  t: TFunction<'dashboard'>
) {
  if (!timeScale) {
    return t('performanceCharts.viewBy.time', { defaultValue: 'Time' })
  }
  return t(`outageAndSubmissionCharts.timeScale.${timeScale}`, {
    defaultValue: timeScale === 'day' ? 'Day' : timeScale === 'week' ? 'Week' : 'Month',
  })
}

type OutageTimeScaleToggleProps = {
  value: OutageTimeScaleKey
  onChange: (value: OutageTimeScaleKey) => void
  ariaLabel?: string
}

export function OutageTimeScaleToggle({ value, onChange, ariaLabel }: OutageTimeScaleToggleProps) {
  const { t } = useTranslation('dashboard')

  return (
    <Flex
      align="center"
      bg="#F4F4F5"
      borderRadius="999px"
      p="4px"
      gap="4px"
      aria-label={ariaLabel}
      sx={{
        '@media (max-width: 525px)': {
          p: '2px',
          gap: '2px',
        },
      }}
    >
      {OUTAGE_TIME_SCALES.map((key) => {
        const isActive = value === key
        const fullLabel = t(`outageAndSubmissionCharts.timeScale.${key}`, {
          defaultValue: key === 'day' ? 'Daily' : key === 'week' ? 'Weekly' : 'Monthly',
        })
        return (
          <Box
            as="button"
            key={key}
            type="button"
            aria-label={fullLabel}
            aria-pressed={isActive}
            h="32px"
            minW="44px"
            px="12px"
            borderRadius="999px"
            bg={isActive ? 'white' : 'transparent'}
            textStyle="bodyText5"
            fontWeight={isActive ? '600' : '500'}
            onClick={() => onChange(key)}
            sx={{
              '@media (max-width: 525px)': {
                h: '26px',
                minW: '34px',
                px: '8px',
                fontSize: '12px',
                lineHeight: '16px',
              },
            }}
          >
            {t(`outageAndSubmissionCharts.timeScaleShort.${key}`, {
              defaultValue: key === 'day' ? 'D' : key === 'week' ? 'W' : 'M',
            })}
          </Box>
        )
      })}
    </Flex>
  )
}
