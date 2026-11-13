import { afterEach, describe, expect, it, jest } from '@jest/globals'

describe('i18n language gating', () => {
  const appConfigBefore = window.APP_CONFIG

  afterEach(() => {
    window.APP_CONFIG = appConfigBefore
    jest.resetModules()
  })

  const loadI18n = async (enabledLanguages?: string[]) => {
    window.APP_CONFIG = {
      API_BASE_URL: '',
      SINGLE_TENANT_MODE: true,
      ENABLED_LANGUAGES: enabledLanguages,
    }
    jest.resetModules()
    return (await import('./index')).default
  }

  it('falls back to the default language when asked for a disabled one', async () => {
    const i18n = await loadI18n(['en', 'hi'])

    await i18n.changeLanguage('as')

    expect(i18n.language).toBe('en')
    expect(i18n.hasResourceBundle('as', 'common')).toBe(false)
  })

  it('switches to an enabled language', async () => {
    const i18n = await loadI18n(['en', 'hi'])

    await i18n.changeLanguage('hi')

    expect(i18n.language).toBe('hi')
  })

  it('offers every language when the key is absent', async () => {
    const i18n = await loadI18n(undefined)

    await i18n.changeLanguage('as')

    expect(i18n.language).toBe('as')
    expect(i18n.hasResourceBundle('as', 'common')).toBe(true)
  })
})
