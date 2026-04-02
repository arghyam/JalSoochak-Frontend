import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

export function AnomaliesPage() {
  const { t } = useTranslation('section-officer')

  return (
    <Box>
      <Heading size="md" mb={6} color="neutral.950">
        {t('pages.anomalies.heading')}
      </Heading>
      <VStack
        align="center"
        justify="center"
        minH="400px"
        bg="white"
        borderRadius="lg"
        border="1px"
        borderColor="neutral.100"
        spacing={2}
      >
        <Text fontSize="2xl" fontWeight="semibold" color="neutral.700">
          {t('pages.anomalies.comingSoon')}
        </Text>
        <Text fontSize="sm" color="neutral.500">
          {t('pages.anomalies.subtitle')}
        </Text>
      </VStack>
    </Box>
  )
}
