import i18n from 'i18next'
import type { Resource, ResourceLanguage } from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enCommon from '@/locales/en/common.json'
import enDashboard from '@/locales/en/dashboard.json'
import enSuperAdmin from '@/locales/en/super-admin.json'
import enStateAdmin from '@/locales/en/state-admin.json'
import enSectionOfficer from '@/locales/en/section-officer.json'
import enAuth from '@/locales/en/auth.json'
import hiCommon from '@/locales/hi/common.json'
import hiDashboard from '@/locales/hi/dashboard.json'
import hiSuperAdmin from '@/locales/hi/super-admin.json'
import hiStateAdmin from '@/locales/hi/state-admin.json'
import hiSectionOfficer from '@/locales/hi/section-officer.json'
import hiAuth from '@/locales/hi/auth.json'
import asCommon from '@/locales/as/common.json'
import asDashboard from '@/locales/as/dashboard.json'
import asSuperAdmin from '@/locales/as/super-admin.json'
import asStateAdmin from '@/locales/as/state-admin.json'
import asSectionOfficer from '@/locales/as/section-officer.json'
import asAuth from '@/locales/as/auth.json'
import { DEFAULT_LANGUAGE, ENABLED_LANGUAGES, type LanguageCode } from './languages'

export {
  DEFAULT_LANGUAGE,
  ENABLED_LANGUAGES,
  SUPPORTED_LANGUAGES,
  isLanguageCode,
} from './languages'
export type { LanguageCode, SupportedLanguage } from './languages'

const allResources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    'super-admin': enSuperAdmin,
    'state-admin': enStateAdmin,
    'section-officer': enSectionOfficer,
    auth: enAuth,
  },
  hi: {
    common: hiCommon,
    dashboard: hiDashboard,
    'super-admin': hiSuperAdmin,
    'state-admin': hiStateAdmin,
    'section-officer': hiSectionOfficer,
    auth: hiAuth,
  },
  as: {
    common: asCommon,
    dashboard: asDashboard,
    'super-admin': asSuperAdmin,
    'state-admin': asStateAdmin,
    'section-officer': asSectionOfficer,
    auth: asAuth,
  },
} satisfies Record<LanguageCode, ResourceLanguage>

// Register only the enabled languages. i18next picks any language that has resources before
// consulting `supportedLngs`, so a detected or cached disabled language would otherwise load.
const resources: Resource = Object.fromEntries(
  ENABLED_LANGUAGES.map(({ code }) => [code, allResources[code]])
)

const isTestEnv = process.env.NODE_ENV === 'test'

if (!isTestEnv) {
  i18n.use(LanguageDetector)
}

i18n.use(initReactI18next).init({
  resources,
  supportedLngs: ENABLED_LANGUAGES.map(({ code }) => code),
  fallbackLng: DEFAULT_LANGUAGE,
  lng: isTestEnv ? DEFAULT_LANGUAGE : undefined,
  defaultNS: 'common',
  ns: ['common', 'dashboard', 'super-admin', 'state-admin', 'section-officer', 'auth'],

  detection: isTestEnv
    ? undefined
    : {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage'],
      },

  interpolation: {
    escapeValue: false, // React already handles XSS
  },

  react: {
    useSuspense: false,
  },
})

export default i18n
