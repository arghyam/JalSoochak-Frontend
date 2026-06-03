import type { DashboardLevel } from '../../types'
import { analyticsApi } from './analytics-api'
import { dashboardDataApi } from './dashboard-data-api'
import { pumpOperatorApi } from './pump-operator-api'
import { tenantApi } from './tenant-api'

export interface DashboardQueryParams {
  level: DashboardLevel
  entityId?: string
}

export type HierarchyType = 'LGD' | 'DEPARTMENT' | 'DEPARTMENTAL' | 'DEPT'

export type TenantListItem = {
  id?: number
  uuid: string
  name: string
  stateCode?: string
  status: string
}

export type TenantListContainer = {
  content?: TenantListItem[]
  totalElements?: number
}

export type TenantListResponse = {
  data?: TenantListContainer | { data?: TenantListContainer }
  content?: TenantListItem[]
  totalElements?: number
}

export type TenantPublicDateFormatConfig = {
  dateFormat: string | null
  timeFormat: string | null
  timezone: string | null
}

export type TenantPublicConfig = {
  averageMembersPerHousehold: number
  waterNorm: number
  dateFormatScreen: TenantPublicDateFormatConfig
  dateFormatTable: TenantPublicDateFormatConfig
  displayDepartmentMaps?: boolean
  displayDepartmentMapLevels?: boolean[]
  displayMapLgdLevels?: boolean[]
}

export type LocationHierarchyLevelName = {
  title?: string
}

export type LocationHierarchyLevel = {
  level?: number
  levelName?: LocationHierarchyLevelName[]
}

export type TenantLocationHierarchyData = {
  hierarchyType?: string
  levels?: LocationHierarchyLevel[]
}

export type TenantLocationHierarchyResponse = {
  data?: TenantLocationHierarchyData
}

export type TenantChildLocation = {
  id?: number
  uuid?: string
  title?: string
  lgdCode?: number
  parentId?: number
  status?: string
}

export type TenantChildLocationsResponse = {
  data?: TenantChildLocation[]
}

export const dashboardApi = {
  ...dashboardDataApi,
  ...analyticsApi,
  ...pumpOperatorApi,
  ...tenantApi,
}
