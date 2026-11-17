import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { SUPPORTED_LANGUAGES, isLanguageCode, resolveEnabledLanguages } from './languages'

const codesOf = (languages: readonly { code: string }[]) => languages.map(({ code }) => code)

describe('isLanguageCode', () => {
  it.each(['en', 'hi', 'as'])('accepts the shipped code %s', (code) => {
    expect(isLanguageCode(code)).toBe(true)
  })

  it.each(['pa', 'EN', '', undefined, 1])('rejects %p', (value) => {
    expect(isLanguageCode(value)).toBe(false)
  })
})

describe('resolveEnabledLanguages', () => {
  let warnSpy: jest.SpiedFunction<typeof console.warn>

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('enables every language when the key is absent, so existing deployments are unaffected', () => {
    expect(resolveEnabledLanguages(undefined)).toBe(SUPPORTED_LANGUAGES)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('narrows to the configured codes', () => {
    expect(codesOf(resolveEnabledLanguages(['en', 'hi']))).toEqual(['en', 'hi'])
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('always keeps the default language, which every missing key falls back to', () => {
    expect(codesOf(resolveEnabledLanguages(['hi']))).toEqual(['en', 'hi'])
    expect(codesOf(resolveEnabledLanguages([]))).toEqual(['en'])
  })

  it('matches codes trimmed and case-insensitively', () => {
    expect(codesOf(resolveEnabledLanguages([' EN ', 'Hi']))).toEqual(['en', 'hi'])
  })

  it('keeps catalogue order regardless of config order', () => {
    expect(codesOf(resolveEnabledLanguages(['as', 'hi', 'en']))).toEqual(['en', 'hi', 'as'])
  })

  it('drops unknown codes and warns about them', () => {
    expect(codesOf(resolveEnabledLanguages(['en', 'pa', 42]))).toEqual(['en'])
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('pa, 42'))
  })

  it.each([['en,hi'], [null], [{ en: true }]])(
    'enables every language and warns when the value is not an array (%p)',
    (configured) => {
      expect(resolveEnabledLanguages(configured)).toBe(SUPPORTED_LANGUAGES)
      expect(warnSpy).toHaveBeenCalledTimes(1)
    }
  )
})

describe('ENABLED_LANGUAGES', () => {
  const appConfigBefore = window.APP_CONFIG

  afterEach(() => {
    window.APP_CONFIG = appConfigBefore
    jest.resetModules()
  })

  it('is resolved from APP_CONFIG.ENABLED_LANGUAGES at startup', async () => {
    window.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: true, ENABLED_LANGUAGES: ['hi'] }
    jest.resetModules()
    const { ENABLED_LANGUAGES } = await import('./languages')

    expect(codesOf(ENABLED_LANGUAGES)).toEqual(['en', 'hi'])
  })
})
