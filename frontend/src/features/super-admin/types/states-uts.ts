export type StateUTStatus = 'active' | 'inactive'

// ── Real API types ────────────────────────────────────────────────────────────

/** Raw tenant object returned by GET /api/v1/tenants */
export interface TenantApiResponse {
  id: number
  uuid: string
  stateCode: string
  lgdCode: number
  name: string
  status: 'ACTIVE' | 'INACTIVE'
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
  status: 'ACTIVE' | 'INACTIVE'
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
  status: StateUTStatus
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

/** name = display name, stateCode = 2-letter ISO code, lgdCode = LGD numeric code */
export const INDIAN_STATES_UTS: { name: string; stateCode: string; lgdCode: number }[] = [
  { name: 'Andhra Pradesh', stateCode: 'AP', lgdCode: 28 },
  { name: 'Arunachal Pradesh', stateCode: 'AR', lgdCode: 12 },
  { name: 'Assam', stateCode: 'AS', lgdCode: 18 },
  { name: 'Bihar', stateCode: 'BR', lgdCode: 10 },
  { name: 'Chhattisgarh', stateCode: 'CG', lgdCode: 22 },
  { name: 'Goa', stateCode: 'GA', lgdCode: 30 },
  { name: 'Gujarat', stateCode: 'GJ', lgdCode: 24 },
  { name: 'Haryana', stateCode: 'HR', lgdCode: 6 },
  { name: 'Himachal Pradesh', stateCode: 'HP', lgdCode: 2 },
  { name: 'Jharkhand', stateCode: 'JH', lgdCode: 20 },
  { name: 'Karnataka', stateCode: 'KA', lgdCode: 29 },
  { name: 'Kerala', stateCode: 'KL', lgdCode: 32 },
  { name: 'Madhya Pradesh', stateCode: 'MP', lgdCode: 23 },
  { name: 'Maharashtra', stateCode: 'MH', lgdCode: 27 },
  { name: 'Manipur', stateCode: 'MN', lgdCode: 14 },
  { name: 'Meghalaya', stateCode: 'ML', lgdCode: 17 },
  { name: 'Mizoram', stateCode: 'MZ', lgdCode: 15 },
  { name: 'Nagaland', stateCode: 'NL', lgdCode: 13 },
  { name: 'Odisha', stateCode: 'OD', lgdCode: 21 },
  { name: 'Punjab', stateCode: 'PB', lgdCode: 3 },
  { name: 'Rajasthan', stateCode: 'RJ', lgdCode: 8 },
  { name: 'Sikkim', stateCode: 'SK', lgdCode: 11 },
  { name: 'Tamil Nadu', stateCode: 'TN', lgdCode: 33 },
  { name: 'Telangana', stateCode: 'TS', lgdCode: 36 },
  { name: 'Tripura', stateCode: 'TR', lgdCode: 16 },
  { name: 'Uttar Pradesh', stateCode: 'UP', lgdCode: 9 },
  { name: 'Uttarakhand', stateCode: 'UK', lgdCode: 5 },
  { name: 'West Bengal', stateCode: 'WB', lgdCode: 19 },
  // Union Territories
  { name: 'Andaman and Nicobar Islands', stateCode: 'AN', lgdCode: 35 },
  { name: 'Chandigarh', stateCode: 'CH', lgdCode: 4 },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', stateCode: 'DH', lgdCode: 26 },
  { name: 'Delhi', stateCode: 'DL', lgdCode: 7 },
  { name: 'Jammu and Kashmir', stateCode: 'JK', lgdCode: 1 },
  { name: 'Ladakh', stateCode: 'LA', lgdCode: 37 },
  { name: 'Lakshadweep', stateCode: 'LD', lgdCode: 31 },
  { name: 'Puducherry', stateCode: 'PY', lgdCode: 34 },
]
