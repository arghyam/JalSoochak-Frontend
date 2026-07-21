import { describe, expect, it, jest, afterEach } from '@jest/globals'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { RecaptchaField } from './recaptcha-field'

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

function setConfig(overrides: { CAPTCHA_ENABLED?: boolean; RECAPTCHA_SITE_KEY?: string }) {
  w.APP_CONFIG = { API_BASE_URL: '', SINGLE_TENANT_MODE: false, ...overrides }
}

describe('RecaptchaField', () => {
  afterEach(() => {
    w.APP_CONFIG = originalConfig
  })

  it('renders nothing when captcha is disabled', () => {
    setConfig({ CAPTCHA_ENABLED: false, RECAPTCHA_SITE_KEY: 'test-site-key' })
    renderWithProviders(<RecaptchaField onChange={jest.fn()} />)
    expect(screen.queryByTestId('recaptcha-widget')).toBeNull()
  })

  it('renders nothing when enabled but no site key is configured', () => {
    setConfig({ CAPTCHA_ENABLED: true, RECAPTCHA_SITE_KEY: '' })
    renderWithProviders(<RecaptchaField onChange={jest.fn()} />)
    expect(screen.queryByTestId('recaptcha-widget')).toBeNull()
  })

  it('renders the widget and forwards the token via onChange when enabled', () => {
    setConfig({ CAPTCHA_ENABLED: true, RECAPTCHA_SITE_KEY: 'test-site-key' })
    const onChange = jest.fn()
    renderWithProviders(<RecaptchaField onChange={onChange} />)
    fireEvent.click(screen.getByTestId('recaptcha-widget'))
    expect(onChange).toHaveBeenCalledWith('test-captcha-token')
  })

  it('shows an error message when provided', () => {
    setConfig({ CAPTCHA_ENABLED: true, RECAPTCHA_SITE_KEY: 'test-site-key' })
    renderWithProviders(
      <RecaptchaField onChange={jest.fn()} error="Please complete the captcha." />
    )
    expect(screen.getByText('Please complete the captcha.')).toBeTruthy()
  })
})
