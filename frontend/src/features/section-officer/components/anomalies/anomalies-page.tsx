import { useTranslation } from 'react-i18next'
import { ComingSoonShell } from '../coming-soon-shell'

export function AnomaliesPage() {
  const { t } = useTranslation('section-officer')

  return (
    <ComingSoonShell
      heading={t('pages.anomalies.heading')}
      comingSoonText={t('pages.anomalies.comingSoon')}
      subtitle={t('pages.anomalies.subtitle')}
    />
  )
}
