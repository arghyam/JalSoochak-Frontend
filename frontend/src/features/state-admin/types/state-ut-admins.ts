export type StateUTAdminStatus = 'active' | 'inactive'

export interface StateUTAdmin extends Record<string, unknown> {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: StateUTAdminStatus
}

export interface CreateStateUTAdminInput {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface UpdateStateUTAdminInput {
  firstName: string
  lastName: string
  phone: string
}
