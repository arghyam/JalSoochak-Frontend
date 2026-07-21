import { describe, expect, it, afterEach } from '@jest/globals'

type TestWindow = Window & {
  APP_CONFIG?: {
    API_BASE_URL: string
    SINGLE_TENANT_MODE?: boolean
    CAPTCHA_ENABLED?: boolean
    RECAPTCHA_SITE_KEY?: string
  }
}

describe('server-config', () => {
  const w = window as TestWindow
  const appConfigBefore = w.APP_CONFIG

  afterEach(() => {
    w.APP_CONFIG = appConfigBefore
    jest.resetModules()
  })

  it('isSingleTenantMode returns boolean value from SINGLE_TENANT_MODE config', async () => {
    w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: false }
    let { isSingleTenantMode } = await import('./server-config')
    expect(isSingleTenantMode()).toBe(false)

    jest.resetModules()
    w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: true }
    ;({ isSingleTenantMode } = await import('./server-config'))
    expect(isSingleTenantMode()).toBe(true)
  })

  it('isCaptchaEnabled is true only when CAPTCHA_ENABLED === true', async () => {
    w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: false }
    let { isCaptchaEnabled } = await import('./server-config')
    expect(isCaptchaEnabled()).toBe(false)

    jest.resetModules()
    w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: false, CAPTCHA_ENABLED: true }
    ;({ isCaptchaEnabled } = await import('./server-config'))
    expect(isCaptchaEnabled()).toBe(true)
  })

  it('getRecaptchaSiteKey returns configured key or empty string', async () => {
    w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: false }
    let { getRecaptchaSiteKey } = await import('./server-config')
    expect(getRecaptchaSiteKey()).toBe('')

    jest.resetModules()
    w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: false, RECAPTCHA_SITE_KEY: 'site-key' }
    ;({ getRecaptchaSiteKey } = await import('./server-config'))
    expect(getRecaptchaSiteKey()).toBe('site-key')
  })
})
