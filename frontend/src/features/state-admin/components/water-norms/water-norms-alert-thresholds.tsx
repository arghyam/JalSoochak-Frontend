import { Box, Heading, SimpleGrid } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { MetricNumberCard } from '@/shared/components/common'

export interface WaterNormsAlertThresholdsProps {
  maxQuantity: string
  minQuantity: string
  regularity: string
  onMaxQuantityChange: (value: string | null) => void
  onMinQuantityChange: (value: string | null) => void
  onRegularityChange: (value: string | null) => void
}

export function WaterNormsAlertThresholds({
  maxQuantity,
  minQuantity,
  regularity,
  onMaxQuantityChange,
  onMinQuantityChange,
  onRegularityChange,
}: WaterNormsAlertThresholdsProps) {
  const { t } = useTranslation(['state-admin', 'common'])

  return (
    <Box mb={6}>
      <Heading as="h3" size="h3" fontWeight="400" fontSize={{ base: 'md', md: 'xl' }} mb={4}>
        {t('waterNorms.alertThresholds.title')}
      </Heading>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 6 }}>
        <MetricNumberCard
          as="article"
          cardAriaLabel={t('waterNorms.aria.maxQuantityCard')}
          title={t('waterNorms.alertThresholds.maxQuantity.title')}
          description={t('waterNorms.alertThresholds.maxQuantity.description')}
          value={maxQuantity}
          onChange={onMaxQuantityChange}
          placeholder={t('common:enter')}
          min={100}
          inputAriaLabel={t('waterNorms.aria.enterMaxQuantity')}
        />
        <MetricNumberCard
          as="article"
          cardAriaLabel={t('waterNorms.aria.minQuantityCard')}
          title={t('waterNorms.alertThresholds.minQuantity.title')}
          description={t('waterNorms.alertThresholds.minQuantity.description')}
          value={minQuantity}
          onChange={onMinQuantityChange}
          placeholder={t('common:enter')}
          min={0}
          inputAriaLabel={t('waterNorms.aria.enterMinQuantity')}
        />
        <MetricNumberCard
          as="article"
          cardAriaLabel={t('waterNorms.aria.regularityCard')}
          title={t('waterNorms.alertThresholds.regularity.title')}
          description={t('waterNorms.alertThresholds.regularity.description')}
          value={regularity}
          onChange={onRegularityChange}
          placeholder={t('common:enter')}
          min={0}
          inputAriaLabel={t('waterNorms.aria.enterRegularity')}
        />
      </SimpleGrid>
    </Box>
  )
}
