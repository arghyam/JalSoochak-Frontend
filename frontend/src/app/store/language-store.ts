import { create } from 'zustand'
import type { LanguageCode } from '@/app/i18n'
import i18n, { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/app/i18n'
import { setAnalyticsUserProperties, trackEvent } from '@/shared/lib/analytics'

export interface LanguageState {
  currentLanguage: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  getSupportedLanguages: () => typeof SUPPORTED_LANGUAGES
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

  getSupportedLanguages: () => SUPPORTED_LANGUAGES,
}))
