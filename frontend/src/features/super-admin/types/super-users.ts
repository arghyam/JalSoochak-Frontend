import type { UserAdminData } from '@/shared/components/common'

/** Super User managed by the super-admin panel. Same shape as UserAdminData. */
export type SuperUser = UserAdminData

export interface CreateSuperUserInput {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface UpdateSuperUserInput {
  firstName: string
  lastName: string
  phone: string
}

// ── Real API types ────────────────────────────────────────────────────────────

/** Raw user object returned by /api/v1/users/super-users, /api/v1/users/state-admins, /api/v1/users/{id} */
export interface ApiUser {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string
  role: string
  tenantCode: string | null
  active: boolean
  createdAt: string
}

/** Paginated list wrapper for user list endpoints */
export interface ApiUsersListResponse {
  content: ApiUser[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

/** Maps raw API user to the internal UserAdminData shape used by shared components */
export function mapApiUserToUserAdminData(u: ApiUser): UserAdminData {
  return {
    id: String(u.id),
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    email: u.email,
    phone: u.phoneNumber,
    status: u.active ? 'active' : 'inactive',
  }
}

/** Invite user request body for POST /api/v1/users/invite */
export interface InviteUserRequest {
  email: string
  role: 'SUPER_USER' | 'STATE_ADMIN'
  tenantCode?: string
}

/** Update user request body for PATCH /api/v1/users/{id} */
export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  phoneNumber?: string
}
