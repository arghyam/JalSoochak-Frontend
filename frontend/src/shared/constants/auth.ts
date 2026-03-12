export const AUTH_ROLES = {
  SUPER_ADMIN: 'SUPER_USER',
  STATE_ADMIN: 'STATE_ADMIN',
  BUSINESS_USER: 'business_user',
} as const

export type AuthRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES]
