import { useCallback, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type ReCAPTCHA from 'react-google-recaptcha'
import { isCaptchaEnabled } from '@/config/server-config'

export interface UseRecaptchaResult {
  /** Whether the captcha feature is turned on via runtime config. */
  enabled: boolean
  /** Current captcha token, or null when unsolved/expired. */
  token: string | null
  /** Ref to attach to the RecaptchaField for imperative reset. */
  recaptchaRef: RefObject<ReCAPTCHA>
  /** Widget callback: token on solve, null on expiry. */
  handleChange: (value: string | null) => void
  /** Widget onExpired callback: clears the stored token. */
  handleExpired: () => void
  /** Clears the token + error and resets the underlying widget. */
  reset: () => void
  /** True when the form may proceed: captcha disabled, or a token is present. */
  satisfied: boolean
  /** Error to surface when submit is blocked by an unsolved captcha. */
  error: string | null
  setError: (message: string | null) => void
}

/**
 * Encapsulates reCAPTCHA v2 token lifecycle for a single form.
 * When captcha is disabled, `satisfied` is always true and nothing should render.
 */
export function useRecaptcha(): UseRecaptchaResult {
  const enabled = isCaptchaEnabled()
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = useCallback((value: string | null) => {
    setToken(value)
    if (value) setError(null)
  }, [])

  const handleExpired = useCallback(() => {
    setToken(null)
  }, [])

  const reset = useCallback(() => {
    setToken(null)
    setError(null)
    recaptchaRef.current?.reset()
  }, [])

  return {
    enabled,
    token,
    recaptchaRef,
    handleChange,
    handleExpired,
    reset,
    satisfied: !enabled || !!token,
    error,
    setError,
  }
}
