import { create } from 'zustand'
import type { LanguageCode, SupportedLanguage } from '@/app/i18n'
import i18n, { ENABLED_LANGUAGES, DEFAULT_LANGUAGE } from '@/app/i18n'
import { setAnalyticsUserProperties, trackEvent } from '@/shared/lib/analytics'

export interface LanguageState {
  currentLanguage: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  /** Languages this deployment offers (`APP_CONFIG.ENABLED_LANGUAGES`). */
  getSupportedLanguages: () => readonly SupportedLanguage[]
}

export const useLanguageStore = create<LanguageState>()((set, get) => ({
  currentLanguage: (i18n.language?.split('-')[0] as LanguageCode) || DEFAULT_LANGUAGE,

  setLanguage: (lang: LanguageCode) => {
    const previousLanguage = get().currentLanguage
    i18n.changeLanguage(lang)
    set({ currentLanguage: lang })

    if (previousLanguage !== lang) {
      trackEvent('language_change', { from: previousLanguage, to: lang })
      // Re-scope the user property so subsequent events report the new language.
      setAnalyticsUserProperties({ language: lang })
    }
  },

  getSupportedLanguages: () => ENABLED_LANGUAGES,
}))
