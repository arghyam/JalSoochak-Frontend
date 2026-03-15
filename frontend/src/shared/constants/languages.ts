export const INDIAN_LANGUAGES = [
  'English',
  'Hindi',
  'Bengali',
  'Telugu',
  'Marathi',
  'Tamil',
  'Urdu',
  'Gujarati',
  'Kannada',
  'Odia',
  'Malayalam',
  'Punjabi',
  'Assamese',
  'Sanskrit',
] as const

export const COUNTRIES = [{ code: 'IN', name: 'India' }] as const

export interface AppLanguage {
  id: string
  label: string
  labelLocale: string
  locale: string
  isActive: boolean
}

export const APP_LANGUAGES: AppLanguage[] = [
  { id: '1', label: 'English', labelLocale: 'English', locale: 'en', isActive: true },
  { id: '2', label: 'Hindi', labelLocale: 'हिंदी', locale: 'hi', isActive: true },
  { id: '3', label: 'Tamil', labelLocale: 'தமிழ்', locale: 'ta', isActive: true },
  { id: '4', label: 'Kannada', labelLocale: 'ಕನ್ನಡ', locale: 'kn', isActive: true },
  { id: '5', label: 'Malayalam', labelLocale: 'മലയാളം', locale: 'ml', isActive: true },
  { id: '6', label: 'Telugu', labelLocale: 'తెలుగు', locale: 'te', isActive: true },
  { id: '7', label: 'Odia', labelLocale: 'ଓଡ଼ିଆ', locale: 'or', isActive: true },
  { id: '8', label: 'Assamese', labelLocale: 'অসমীয়া', locale: 'as', isActive: true },
  { id: '9', label: 'Gujarati', labelLocale: 'ગુજરાતી', locale: 'gu', isActive: true },
  { id: '10', label: 'Bengali', labelLocale: 'বাংলা', locale: 'bn', isActive: true },
  { id: '11', label: 'Punjabi', labelLocale: 'ਪੰਜਾਬੀ', locale: 'pa', isActive: true },
  { id: '12', label: 'Marathi', labelLocale: 'मराठी', locale: 'mr', isActive: true },
  { id: '13', label: 'Urdu', labelLocale: 'اردو', locale: 'ur', isActive: true },
]

/** Returns the ISO locale code for a language label (case-insensitive). */
export function getLocaleByLabel(label: string): string | undefined {
  const lower = label.toLowerCase()
  return APP_LANGUAGES.find((l) => l.label.toLowerCase() === lower)?.locale
}
