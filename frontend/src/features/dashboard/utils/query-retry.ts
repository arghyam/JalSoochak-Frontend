import { isAxiosError } from 'axios'

const MAX_RETRIES = 2

/**
 * A TanStack Query `retry` that retries only failures a later attempt can get past: no response, a
 * 429 from the gateway's rate limit, or a 5xx. Any other status, or an error the client raised itself
 * (an invalid payload), fails at once. Retries back off with TanStack's default delay.
 */
export const retryTransientFailures = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= MAX_RETRIES || !isAxiosError(error)) return false

  const status = error.response?.status
  return status === undefined || status === 429 || status >= 500
}
