export type StateAdminStatus = 'active' | 'pending' | 'inactive'

export interface StateAdmin {
  id: string
  adminName: string
  stateUt: string
  mobileNumber: string
  emailAddress: string
  status: StateAdminStatus
}
