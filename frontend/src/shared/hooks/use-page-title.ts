import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function usePageTitle(i18nKey: string, ns?: string) {
  const { t } = useTranslation(ns)
  useEffect(() => {
    document.title = `${t(i18nKey)} | JalSoochak`
  }, [t, i18nKey])
}
