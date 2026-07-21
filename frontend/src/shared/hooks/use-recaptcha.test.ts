import { describe, expect, it, afterEach } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'
import { useRecaptcha } from './use-recaptcha'

type TestWindow = Window & {
  APP_CONFIG?: {
    API_BASE_URL: string
    SINGLE_TENANT_MODE?: boolean
    CAPTCHA_ENABLED?: boolean
    RECAPTCHA_SITE_KEY?: string
  }
}

const w = window as TestWindow
const originalConfig = w.APP_CONFIG

function enableCaptcha() {
  w.APP_CONFIG = {
    API_BASE_URL: '',
    SINGLE_TENANT_MODE: false,
    CAPTCHA_ENABLED: true,
    RECAPTCHA_SITE_KEY: 'test-site-key',
  }
}

describe('useRecaptcha', () => {
  afterEach(() => {
    w.APP_CONFIG = originalConfig
  })

  it('is disabled and always satisfied when captcha is off', () => {
    w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: false, CAPTCHA_ENABLED: false }
    const { result } = renderHook(() => useRecaptcha())
    expect(result.current.enabled).toBe(false)
    expect(result.current.satisfied).toBe(true)
  })

  it('requires a token when enabled and satisfies once solved', () => {
    enableCaptcha()
    const { result } = renderHook(() => useRecaptcha())
    expect(result.current.enabled).toBe(true)
    expect(result.current.satisfied).toBe(false)

    act(() => result.current.handleChange('token-123'))
    expect(result.current.token).toBe('token-123')
    expect(result.current.satisfied).toBe(true)
  })

  it('clears the token on expiry', () => {
    enableCaptcha()
    const { result } = renderHook(() => useRecaptcha())
    act(() => result.current.handleChange('token-123'))
    act(() => result.current.handleExpired())
    expect(result.current.token).toBeNull()
    expect(result.current.satisfied).toBe(false)
  })

  it('reset clears token and error', () => {
    enableCaptcha()
    const { result } = renderHook(() => useRecaptcha())
    act(() => {
      result.current.handleChange('token-123')
      result.current.setError('Please complete the captcha verification.')
    })
    act(() => result.current.reset())
    expect(result.current.token).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
