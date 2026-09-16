import { beforeEach, describe, expect, it, jest } from '@jest/globals'

const mockChangeLanguage = jest.fn()
const mockTrackEvent = jest.fn()
const mockSetAnalyticsUserProperties = jest.fn()

jest.mock('@/app/i18n', () => ({
  __esModule: true,
  default: {
    language: 'en',
    changeLanguage: (lang: string) => mockChangeLanguage(lang),
  },
  SUPPORTED_LANGUAGES: [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  ],
  DEFAULT_LANGUAGE: 'en',
}))

jest.mock('@/shared/lib/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  setAnalyticsUserProperties: (props: unknown) => mockSetAnalyticsUserProperties(props),
}))

import { useLanguageStore } from './language-store'

beforeEach(() => {
  jest.clearAllMocks()
  useLanguageStore.setState({ currentLanguage: 'en' })
})

describe('useLanguageStore.setLanguage', () => {
  it('changes the i18n language and stores it', () => {
    useLanguageStore.getState().setLanguage('hi')

    expect(mockChangeLanguage).toHaveBeenCalledWith('hi')
    expect(useLanguageStore.getState().currentLanguage).toBe('hi')
  })

  it('reports the change with the previous and next language', () => {
    useLanguageStore.getState().setLanguage('as')

    expect(mockTrackEvent).toHaveBeenCalledWith('language_change', { from: 'en', to: 'as' })
  })

  it('re-scopes the language user property so later events follow the new language', () => {
    useLanguageStore.getState().setLanguage('as')

    expect(mockSetAnalyticsUserProperties).toHaveBeenCalledWith({ language: 'as' })
  })

  it('reports nothing when the selected language is already active', () => {
    useLanguageStore.getState().setLanguage('en')

    expect(mockTrackEvent).not.toHaveBeenCalled()
    expect(mockSetAnalyticsUserProperties).not.toHaveBeenCalled()
  })

  it('tracks the previous language across consecutive changes', () => {
    useLanguageStore.getState().setLanguage('hi')
    useLanguageStore.getState().setLanguage('as')

    expect(mockTrackEvent).toHaveBeenNthCalledWith(2, 'language_change', { from: 'hi', to: 'as' })
  })

  it('exposes the supported languages', () => {
    expect(useLanguageStore.getState().getSupportedLanguages()).toHaveLength(3)
  })
})
