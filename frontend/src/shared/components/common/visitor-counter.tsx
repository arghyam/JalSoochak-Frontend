import { Box, HStack, Skeleton, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { RiEyeLine } from 'react-icons/ri'
import { isAnalyticsEnabled } from '@/config/server-config'
import { useVisitorCountQuery } from '@/shared/lib/site-stats/use-visitor-count-query'

/**
 * Public visitor total for the dashboard footer.
 *
 * Renders nothing unless Firebase is configured, so dev and staging neither display a
 * counter nor contribute to the production number.
 */
export function VisitorCounter() {
  const { t, i18n } = useTranslation()
  const { data: count, isLoading, isError } = useVisitorCountQuery()

  if (!isAnalyticsEnabled()) return null

  if (isLoading) {
    return <Skeleton height="32px" width="120px" borderRadius="full" />
  }

  // A counter that cannot load is not worth an error message in the footer.
  if (isError || count === undefined) return null

  return (
    <HStack
      spacing="8px"
      bg="neutral.25"
      borderWidth="1px"
      borderColor="neutral.200"
      borderRadius="full"
      px="12px"
      py="6px"
      aria-label={t('footer.visitorsAria', { count })}
    >
      <Box w="8px" h="8px" borderRadius="full" bg="success.500" flexShrink={0} />
      <Box as={RiEyeLine} color="neutral.500" fontSize="16px" aria-hidden="true" />
      <Text fontSize="sm" fontWeight="600" color="neutral.700">
        {count.toLocaleString(i18n.language)}
      </Text>
      <Text fontSize="sm" color="neutral.500">
        {t('footer.visitors')}
      </Text>
    </HStack>
  )
}
