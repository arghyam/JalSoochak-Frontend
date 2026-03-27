export type TenantStatus = 'ACTIVE' | 'INACTIVE'

export interface CreateTenantInput {
  stateCode: string
  name: string
}

export interface Tenant {
  id: number
  uuid: string
  stateCode: string
  name: string
  status: TenantStatus
  createdAt: string
  createdBy: string
  onBoardedAt: string
  updatedAt: string
  updatedBy: string
}

export interface CreateTenantResponse {
  status: 201
  message: string
  data: Tenant
}
