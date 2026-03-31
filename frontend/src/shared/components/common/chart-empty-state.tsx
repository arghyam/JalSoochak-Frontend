import { Box, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

type ChartEmptyStateProps = {
  minHeight?: string | number
  message?: string
}

export function ChartEmptyState({ minHeight = '400px', message }: ChartEmptyStateProps) {
  const { t } = useTranslation('common')

  return (
    <Box
      minH={typeof minHeight === 'number' ? `${minHeight}px` : minHeight}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Text color="neutral.600">{message ?? t('noDataAvailable')}</Text>
    </Box>
  )
}
