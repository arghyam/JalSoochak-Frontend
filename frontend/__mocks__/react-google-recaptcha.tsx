import { forwardRef, useImperativeHandle } from 'react'

/**
 * Jest manual mock for `react-google-recaptcha`.
 * Auto-applied to all tests (node_modules manual mock). Renders a button that
 * yields a fake token via `onChange` when clicked, and exposes an imperative
 * `reset()` that clears the token — enough to drive the captcha-enabled paths.
 */
interface MockReCAPTCHAProps {
  onChange?: (token: string | null) => void
  onExpired?: () => void
  sitekey?: string
}

const ReCAPTCHA = forwardRef<{ reset: () => void }, MockReCAPTCHAProps>(function MockReCAPTCHA(
  { onChange },
  ref
) {
  useImperativeHandle(ref, () => ({
    reset: () => onChange?.(null),
    execute: () => {},
    executeAsync: async () => 'test-captcha-token',
    getValue: () => 'test-captcha-token',
    getWidgetId: () => 1,
  }))

  return (
    <button
      type="button"
      data-testid="recaptcha-widget"
      onClick={() => onChange?.('test-captcha-token')}
    >
      reCAPTCHA
    </button>
  )
})

export default ReCAPTCHA
