import { Box, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

type ChartEmptyStateProps = {
  minHeight?: string | number
  message?: string
}

export function ChartEmptyState({ minHeight = '400px', message }: ChartEmptyStateProps) {
  const { t } = useTranslation('common')
  const resolvedMinHeight = typeof minHeight === 'number' ? `${minHeight}px` : minHeight

  return (
    <Box
      w="full"
      h="full"
      minH={resolvedMinHeight}
      display="flex"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
    >
      <Text color="neutral.600">{message ?? t('noDataAvailable')}</Text>
    </Box>
  )
}
