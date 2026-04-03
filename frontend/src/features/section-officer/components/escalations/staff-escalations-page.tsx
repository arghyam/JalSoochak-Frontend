import { useTranslation } from 'react-i18next'
import { ComingSoonShell } from '../coming-soon-shell'

export function StaffEscalationsPage() {
  const { t } = useTranslation('section-officer')

  return (
    <ComingSoonShell
      heading={t('pages.escalations.heading')}
      comingSoonText={t('pages.escalations.comingSoon')}
      subtitle={t('pages.escalations.subtitle')}
    />
  )
}
