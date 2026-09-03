import { Box, Flex } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { SchemeStatusDimension } from '@/shared/constants/scheme-status'

const DIMENSIONS: SchemeStatusDimension[] = ['operatingStatus', 'workStatus']

interface SchemeStatusDimensionToggleProps {
  value: SchemeStatusDimension
  onChange: (value: SchemeStatusDimension) => void
  ariaLabel?: string
}

export function SchemeStatusDimensionToggle({
  value,
  onChange,
  ariaLabel,
}: SchemeStatusDimensionToggleProps) {
  const { t } = useTranslation('dashboard')

  return (
    <Flex
      role="group"
      aria-label={ariaLabel}
      align="center"
      bg="neutral.100"
      borderRadius="999px"
      p="4px"
      gap="4px"
      sx={{
        '@media (max-width: 767px)': {
          p: '2px',
          gap: '2px',
        },
      }}
    >
      {DIMENSIONS.map((dimension) => {
        const isActive = value === dimension
        const label = t(
          `pumpOperators.dimension.${dimension === 'workStatus' ? 'work' : 'operating'}`,
          {
            defaultValue: dimension === 'workStatus' ? 'Work' : 'Operating',
          }
        )
        return (
          <Box
            as="button"
            key={dimension}
            type="button"
            aria-pressed={isActive}
            h="32px"
            px="12px"
            borderRadius="999px"
            bg={isActive ? 'white' : 'transparent'}
            textStyle="bodyText5"
            fontWeight={isActive ? '600' : '500'}
            onClick={() => onChange(dimension)}
            sx={{
              '@media (max-width: 767px)': {
                h: '26px',
                px: '8px',
                fontSize: '12px',
                lineHeight: '16px',
              },
            }}
          >
            {label}
          </Box>
        )
      })}
    </Flex>
  )
}
