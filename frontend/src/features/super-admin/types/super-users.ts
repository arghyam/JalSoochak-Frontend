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
