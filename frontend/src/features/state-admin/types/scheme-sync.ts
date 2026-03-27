export interface Scheme {
  id: number
  uuid: string
  stateSchemeId: string
  centreSchemeId: string
  schemeName: string
  fhtcCount: number
  plannedFhtc: number
  houseHoldCount: number
  latitude: number
  longitude: number
  channel: string | null
  workStatus: string
  operatingStatus: string
}

export interface StatusCount {
  status: string
  count: number
}

export interface SchemeCounts {
  totalSchemes: number
  activeSchemes: number
  inactiveSchemes: number
  statusCounts: StatusCount[]
  workStatusCounts: StatusCount[]
  operatingStatusCounts: StatusCount[]
}

export interface SchemeListParams {
  tenantCode: string
  page: number
  limit: number
  workStatus?: string
  operatingStatus?: string
}

export interface SchemeListResponse {
  items: Scheme[]
  totalElements: number
}
