/**
 * Identity claims are deliberately absent: the token carries no name, email or phone.
 * Profile fields come from the auth response body and GET /api/v1/users/me.
 */
interface JWTPayload {
  sub: string
  exp?: number
  iat?: number
}

export function parseJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    return JSON.parse(jsonPayload) as JWTPayload
  } catch (error) {
    console.error('Failed to parse JWT:', error)
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token)
  if (!payload || !payload.exp) return true

  return Date.now() >= payload.exp * 1000
}
