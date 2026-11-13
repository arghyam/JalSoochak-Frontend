import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import i18n, { SUPPORTED_LANGUAGES } from '@/app/i18n'
import {
  BRANDING_PROFILES,
  DEFAULT_BRANDING_PROFILE_ID,
  isBrandingProfileId,
  resolveBrandingProfileId,
} from './branding'
import type { BrandingProfile } from './branding-profile'

describe('isBrandingProfileId', () => {
  it.each(['assam', 'punjab'])('accepts the known profile %s', (id) => {
    expect(isBrandingProfileId(id)).toBe(true)
  })

  it.each(['kerala', 'Assam', 'toString', '', undefined, 1])('rejects %p', (value) => {
    expect(isBrandingProfileId(value)).toBe(false)
  })
})

describe('resolveBrandingProfileId', () => {
  let warnSpy: jest.SpiedFunction<typeof console.warn>

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('defaults to Assam, so the existing deployment keeps its branding without the key', () => {
    expect(DEFAULT_BRANDING_PROFILE_ID).toBe('assam')
    expect(resolveBrandingProfileId(undefined)).toBe('assam')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('is not set'))
  })

  it('returns a configured profile without warning', () => {
    expect(resolveBrandingProfileId('punjab')).toBe('punjab')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('matches the profile trimmed and case-insensitively', () => {
    expect(resolveBrandingProfileId(' Punjab ')).toBe('punjab')
  })

  it.each([['kerala'], [42], [null]])(
    'falls back to the default and names the bad value (%p)',
    (configured) => {
      expect(resolveBrandingProfileId(configured)).toBe(DEFAULT_BRANDING_PROFILE_ID)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(String(configured)))
    }
  )
})

describe('getBrandingProfile', () => {
  const appConfigBefore = window.APP_CONFIG

  afterEach(() => {
    window.APP_CONFIG = appConfigBefore
    jest.resetModules()
  })

  it('returns the profile named in APP_CONFIG.BRANDING_PROFILE', async () => {
    window.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: true, BRANDING_PROFILE: 'punjab' }
    jest.resetModules()
    const { getBrandingProfile, BRANDING_PROFILES: profiles } = await import('./branding')

    expect(getBrandingProfile()).toBe(profiles.punjab)
  })

  it('resolves once, so a misconfiguration warns once rather than on every render', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    window.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: true }
    jest.resetModules()
    const { getBrandingProfile, BRANDING_PROFILES: profiles } = await import('./branding')

    getBrandingProfile()
    expect(getBrandingProfile()).toBe(profiles.assam)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    warnSpy.mockRestore()
  })
})

/** Every `common` i18n key the footer renders for a profile. */
function translationKeysOf(profile: BrandingProfile): string[] {
  const { footer } = profile
  return [
    ...footer.quickLinks.map(({ labelKey }) => labelKey),
    ...footer.socialLinks.map(({ network }) => `footer.social.${network}`),
    footer.contact.phoneKey,
    footer.contact.addressKey,
    footer.copyrightOrg.labelKey,
  ]
}

describe.each(Object.entries(BRANDING_PROFILES))('%s branding profile', (_id, profile) => {
  it.each(SUPPORTED_LANGUAGES.map(({ code }) => code))(
    'has every referenced key translated in %s',
    (lng) => {
      // getResource does not fall back to English, so a key missing from this locale fails.
      const missing = translationKeysOf(profile).filter(
        (key) => typeof i18n.getResource(lng, 'common', key) !== 'string'
      )

      expect(missing).toEqual([])
    }
  )

  it('uses unique analytics keys for its quick links', () => {
    const keys = profile.footer.quickLinks.map(({ key }) => key)

    expect(new Set(keys).size).toBe(keys.length)
  })
})
