export const AUTH_ROLES = {
  SUPER_ADMIN: 'SUPER_USER',
  STATE_ADMIN: 'STATE_ADMIN',
} as const

export type AuthRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES]
