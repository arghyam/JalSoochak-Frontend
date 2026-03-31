export type StaffRole = 'PUMP_OPERATOR' | 'SECTION_OFFICER' | 'SUB_DIVISIONAL_OFFICER'

export type StaffStatus = 'ACTIVE' | 'INACTIVE'

export interface StaffScheme {
  schemeId: number
  schemeName: string
  workStatus: string
  operatingStatus: string
}

export interface StaffMember extends Record<string, unknown> {
  id: number
  uuid: string
  title: string
  email: string
  phoneNumber: string
  status: StaffStatus
  role: StaffRole
  schemes: StaffScheme[]
}

export interface StaffListParams {
  roles: StaffRole[]
  status?: StaffStatus
  name?: string
  page: number
  limit: number
  tenantCode: string
}

export interface StaffListResponse {
  items: StaffMember[]
  totalElements: number
}
