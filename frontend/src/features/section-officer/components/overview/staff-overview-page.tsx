import { useTranslation } from 'react-i18next'
import { ComingSoonShell } from '../coming-soon-shell'

export function StaffOverviewPage() {
  const { t } = useTranslation('section-officer')

  return (
    <ComingSoonShell
      heading={t('pages.overview.heading')}
      comingSoonText={t('pages.overview.comingSoon')}
      subtitle={t('pages.overview.subtitle')}
    />
  )
}
