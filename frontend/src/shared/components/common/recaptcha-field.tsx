import { forwardRef } from 'react'
import { Box, FormControl, FormErrorMessage } from '@chakra-ui/react'
import ReCAPTCHA from 'react-google-recaptcha'
import { getRecaptchaSiteKey, isCaptchaEnabled } from '@/config/server-config'

export interface RecaptchaFieldProps {
  /** Called when the captcha is solved (token) or expires (null). */
  onChange: (token: string | null) => void
  /** Called when a previously-solved token expires. */
  onExpired?: () => void
  /** Error message shown below the widget. */
  error?: string | null
}

/**
 * reCAPTCHA v2 (checkbox) widget, gated by runtime config.
 * Renders nothing when captcha is disabled or no site key is configured,
 * so callers can mount it unconditionally.
 */
export const RecaptchaField = forwardRef<ReCAPTCHA, RecaptchaFieldProps>(function RecaptchaField(
  { onChange, onExpired, error },
  ref
) {
  const siteKey = getRecaptchaSiteKey()
  if (!isCaptchaEnabled() || !siteKey) return null

  return (
    <FormControl isInvalid={!!error}>
      <Box>
        <ReCAPTCHA ref={ref} sitekey={siteKey} onChange={onChange} onExpired={onExpired} />
      </Box>
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  )
})
