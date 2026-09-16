import { describe, expect, it, afterEach } from '@jest/globals'

type TestWindow = Window & {
  APP_CONFIG?: {
    API_BASE_URL: string
    SINGLE_TENANT_MODE?: boolean
    CAPTCHA_ENABLED?: boolean
    RECAPTCHA_SITE_KEY?: string
    FIREBASE?: Record<string, string>
  }
}

const FULL_FIREBASE_CONFIG = {
  apiKey: 'test-api-key',
  authDomain: 'test.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test.firebasestorage.app',
  messagingSenderId: '1234',
  appId: '1:1234:web:abcd',
  measurementId: 'G-TEST',
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

  describe('getFirebaseConfig — the analytics gate', () => {
    it('returns undefined when no FIREBASE block is present, as on dev and staging', async () => {
      w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: false }
      const { getFirebaseConfig, isAnalyticsEnabled } = await import('./server-config')

      expect(getFirebaseConfig()).toBeUndefined()
      expect(isAnalyticsEnabled()).toBe(false)
    })

    it('returns the config when every required credential is present', async () => {
      w.APP_CONFIG = {
        API_BASE_URL: '',
        SINGLE_TENANT_MODE: false,
        FIREBASE: FULL_FIREBASE_CONFIG,
      }
      const { getFirebaseConfig, isAnalyticsEnabled } = await import('./server-config')

      expect(getFirebaseConfig()).toEqual(FULL_FIREBASE_CONFIG)
      expect(isAnalyticsEnabled()).toBe(true)
    })

    it.each(['apiKey', 'projectId', 'appId', 'measurementId'])(
      'treats a config missing %s as absent rather than initialising Firebase partially',
      async (missingKey) => {
        const partial = { ...FULL_FIREBASE_CONFIG }
        delete partial[missingKey as keyof typeof partial]
        w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: false, FIREBASE: partial }
        const { getFirebaseConfig, isAnalyticsEnabled } = await import('./server-config')

        expect(getFirebaseConfig()).toBeUndefined()
        expect(isAnalyticsEnabled()).toBe(false)
      }
    )

    it('treats a blank credential as absent', async () => {
      w.APP_CONFIG = {
        API_BASE_URL: '',
        SINGLE_TENANT_MODE: false,
        FIREBASE: { ...FULL_FIREBASE_CONFIG, apiKey: '   ' },
      }
      const { isAnalyticsEnabled } = await import('./server-config')

      expect(isAnalyticsEnabled()).toBe(false)
    })

    it('ignores an optional credential being absent', async () => {
      // authDomain, storageBucket and messagingSenderId are not required to initialise.
      const {
        authDomain: _a,
        storageBucket: _s,
        messagingSenderId: _m,
        ...required
      } = FULL_FIREBASE_CONFIG
      w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: false, FIREBASE: required }
      const { isAnalyticsEnabled } = await import('./server-config')

      expect(isAnalyticsEnabled()).toBe(true)
    })
  })
})
