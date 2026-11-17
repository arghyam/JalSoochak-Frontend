/**
 * Language catalogue and the subset of it a deployment offers.
 *
 * Kept free of i18next so it can be imported and unit-tested without initialising i18n.
 */

import { getRuntimeConfig } from '@/config/runtime-config'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export type LanguageCode = SupportedLanguage['code']

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

export function isLanguageCode(value: unknown): value is LanguageCode {
  return SUPPORTED_LANGUAGES.some((language) => language.code === value)
}

/**
 * Narrows the catalogue to `APP_CONFIG.ENABLED_LANGUAGES`.
 *
 * - Absent: every language, so deployments without the key behave as before.
 * - Codes are matched trimmed and case-insensitively; unknown ones are dropped with a warning.
 * - DEFAULT_LANGUAGE is always kept, because it is the fallback for every missing key.
 * - The result keeps catalogue order, so the switcher order is stable across deployments.
 */
export function resolveEnabledLanguages(configured: unknown): readonly SupportedLanguage[] {
  if (configured === undefined) return SUPPORTED_LANGUAGES

  if (!Array.isArray(configured)) {
    console.warn(
      '[Config] APP_CONFIG.ENABLED_LANGUAGES must be an array of language codes. Enabling all languages.'
    )
    return SUPPORTED_LANGUAGES
  }

  const requested: unknown[] = configured.map((code: unknown) =>
    typeof code === 'string' ? code.trim().toLowerCase() : code
  )

  const unknownCodes = requested.filter((code) => !isLanguageCode(code))
  if (unknownCodes.length > 0) {
    console.warn(
      `[Config] Ignoring unknown APP_CONFIG.ENABLED_LANGUAGES codes: ${unknownCodes.map(String).join(', ')}`
    )
  }

  return SUPPORTED_LANGUAGES.filter(
    (language) => language.code === DEFAULT_LANGUAGE || requested.includes(language.code)
  )
}

/** Languages this deployment offers, resolved once from runtime config at startup. */
export const ENABLED_LANGUAGES = resolveEnabledLanguages(getRuntimeConfig().ENABLED_LANGUAGES)
