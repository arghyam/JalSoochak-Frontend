import type { SchemeStatusCount } from '@/shared/constants/scheme-status'

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

/**
 * Scheme counts by status. The derived `activeSchemes` / `inactiveSchemes` / `statusCounts` fields
 * were removed from the backend along with the active/inactive binary; the two real dimensions are
 * all that remain. Buckets share the `SchemeStatusCount` shape with analytics-service, so one
 * component can render either service's breakdown.
 */
export interface SchemeCounts {
  totalSchemes: number
  workStatusCounts: SchemeStatusCount[]
  operatingStatusCounts: SchemeStatusCount[]
}

export interface SchemeListParams {
  tenantCode: string
  page: number
  limit: number
  workStatus?: string
  operatingStatus?: string
  schemeName?: string
  sortDir?: string
}

export interface SchemeListResponse {
  items: Scheme[]
  totalElements: number
}

export type UpdateSchemeStatusPayload = { workStatus: string } | { operatingStatus: string }
