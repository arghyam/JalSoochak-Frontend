/**
 * Cookie utility for reading/writing/deleting browser cookies.
 * Handles encoding/decoding to safely store values.
 */

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year in seconds

/**
 * Get a cookie value by name.
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const nameEQ = `${name}=`
  const cookies = document.cookie.split(';')

  for (const cookie of cookies) {
    const trimmed = cookie.trim()
    if (trimmed.startsWith(nameEQ)) {
      try {
        return decodeURIComponent(trimmed.substring(nameEQ.length))
      } catch {
        return null
      }
    }
  }

  return null
}

/**
 * Set a cookie with a 1-year expiration.
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Optional cookie attributes
 */
export function setCookie(
  name: string,
  value: string,
  options?: {
    maxAge?: number
    path?: string
    sameSite?: 'Strict' | 'Lax' | 'None'
  }
): void {
  if (typeof document === 'undefined') return

  const maxAge = options?.maxAge ?? COOKIE_MAX_AGE
  const path = options?.path ?? '/'
  const sameSite = options?.sameSite ?? 'Lax'

  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=${path}; samesite=${sameSite}`
}

/**
 * Delete a cookie by name.
 * @param name - Cookie name
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  setCookie(name, '', { maxAge: 0 })
}
