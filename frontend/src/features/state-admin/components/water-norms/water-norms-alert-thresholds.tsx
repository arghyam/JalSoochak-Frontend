import { Box, Heading, SimpleGrid, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { MetricNumberCard } from '@/shared/components/common'

export interface WaterNormsAlertThresholdsProps {
  oversupplyThreshold: string
  undersupplyThreshold: string
  onOversupplyThresholdChange: (value: string) => void
  onUndersupplyThresholdChange: (value: string) => void
  errors?: Record<string, string>
}

export function WaterNormsAlertThresholds({
  oversupplyThreshold,
  undersupplyThreshold,
  onOversupplyThresholdChange,
  onUndersupplyThresholdChange,
  errors,
}: Readonly<WaterNormsAlertThresholdsProps>) {
  const { t } = useTranslation(['state-admin', 'common'])

  return (
    <Box mb={6}>
      <Heading as="h3" size="h3" fontWeight="400" fontSize={{ base: 'md', md: 'xl' }} mb={4}>
        {t('waterNorms.alertThresholds.title')}
      </Heading>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 6 }}>
        <Box>
          <MetricNumberCard
            as="article"
            cardAriaLabel={t('waterNorms.aria.undersupplyThresholdCard')}
            title={t('waterNorms.alertThresholds.undersupplyThreshold.title')}
            description={t('waterNorms.alertThresholds.undersupplyThreshold.description')}
            value={undersupplyThreshold}
            onChange={onUndersupplyThresholdChange}
            placeholder={t('common:enter')}
            min={0}
            max={100}
            inputAriaLabel={t('waterNorms.aria.enterUndersupplyThreshold')}
          />
          {errors?.undersupplyThreshold && (
            <Text color="error.500" fontSize="sm" mt={1}>
              {errors.undersupplyThreshold}
            </Text>
          )}
        </Box>
        <Box>
          <MetricNumberCard
            as="article"
            cardAriaLabel={t('waterNorms.aria.oversupplyThresholdCard')}
            title={t('waterNorms.alertThresholds.oversupplyThreshold.title')}
            description={t('waterNorms.alertThresholds.oversupplyThreshold.description')}
            value={oversupplyThreshold}
            onChange={onOversupplyThresholdChange}
            placeholder={t('common:enter')}
            min={0}
            max={1000}
            inputAriaLabel={t('waterNorms.aria.enterOversupplyThreshold')}
          />
          {errors?.oversupplyThreshold && (
            <Text color="error.500" fontSize="sm" mt={1}>
              {errors.oversupplyThreshold}
            </Text>
          )}
        </Box>
      </SimpleGrid>
    </Box>
  )
}
