export const TENANT_STATUSES = [
  'INACTIVE',
  'ONBOARDED',
  'CONFIGURED',
  'ACTIVE',
  'SUSPENDED',
  'DEGRADED',
  'ARCHIVED',
] as const

export type TenantStatus = (typeof TENANT_STATUSES)[number]

// ── Real API types ────────────────────────────────────────────────────────────

/** Raw tenant object returned by GET /api/v1/tenants */
export interface TenantApiResponse {
  id: number
  uuid: string
  stateCode: string
  lgdCode: number
  name: string
  status: TenantStatus
  createdAt: string
  createdBy: number | null
  onboardedAt: string | null
  updatedAt: string
  updatedBy: number | null
}

/** Paginated list wrapper returned by GET /api/v1/tenants */
export interface TenantsListApiResponse {
  content: TenantApiResponse[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

/** Internal app representation of a tenant (mapped from TenantApiResponse) */
export interface Tenant {
  id: number
  uuid: string
  stateCode: string
  lgdCode: number
  name: string
  status: TenantStatus
  createdAt: string
}

export function mapTenantApiToTenant(t: TenantApiResponse): Tenant {
  return {
    id: t.id,
    uuid: t.uuid,
    stateCode: t.stateCode,
    lgdCode: t.lgdCode,
    name: t.name,
    status: t.status,
    createdAt: t.createdAt,
  }
}

export interface StateAdminDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
  secondaryEmail?: string
  contactNumber?: string
}

export interface StateUT {
  id: string
  name: string
  code: string
  status: string
  lastSyncDate: Date
  totalDistricts: number
  admin: StateAdminDetails
}

export interface CreateStateUTInput {
  name: string
  code: string
  admin: StateAdminDetails
}

export interface StateUTOption {
  name: string
  code: string
}

export interface UpdateStateUTInput {
  admin: Omit<StateAdminDetails, 'email'> & { email?: string }
}

/** Request body for POST /api/v2/users (create tenant admin). */
export interface CreateTenantAdminRequest {
  firstName: string
  lastName: string
  primaryEmail: string
  secondaryEmail?: string
  primaryPhone: string
  secondaryPhone?: string
  role: 'TENANT_ADMIN'
}

/** Response data for create tenant admin API. */
export interface CreateTenantAdminResponseData {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  primaryEmail: string
  secondaryEmail: string
  primaryPhone: string
  secondaryPhone: string
  role: string
  status: string
  createdAt: string
  updatedAt: string
}

/** Full API response for POST /api/v2/users (create tenant admin). */
export interface CreateTenantAdminApiResponse {
  status: string
  message: string
  data: CreateTenantAdminResponseData
}
