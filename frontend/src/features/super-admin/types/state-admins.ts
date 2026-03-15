export type StateAdminSignupStatus = 'completed' | 'pending' | 'inactive'

export interface StateAdmin {
  id: string
  adminName: string
  stateUt: string
  mobileNumber: string
  emailAddress: string
  signupStatus: StateAdminSignupStatus
}
