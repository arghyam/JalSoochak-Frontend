import { useTranslation } from 'react-i18next'
import { ComingSoonShell } from '../coming-soon-shell'

export function PumpOperatorsPage() {
  const { t } = useTranslation('section-officer')

  return (
    <ComingSoonShell
      heading={t('pages.pumpOperators.heading')}
      comingSoonText={t('pages.pumpOperators.comingSoon')}
      subtitle={t('pages.pumpOperators.subtitle')}
    />
  )
}
