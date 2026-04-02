import { useTranslation } from 'react-i18next'
import { ComingSoonShell } from '../coming-soon-shell'

export function SchemesPage() {
  const { t } = useTranslation('section-officer')

  return (
    <ComingSoonShell
      heading={t('pages.schemes.heading')}
      comingSoonText={t('pages.schemes.comingSoon')}
      subtitle={t('pages.schemes.subtitle')}
    />
  )
}
