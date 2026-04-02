export interface SchemeMapping {
  id: number
  schemeId: number
  stateSchemeId: string
  schemeName: string
  villageLgdCode: string
  villageName: string
  subDivisionName: string
}

export interface SchemeMappingListParams {
  tenantCode: string
  page: number
  limit: number
  schemeName?: string
  sortDir?: string
}

export interface SchemeMappingListResponse {
  items: SchemeMapping[]
  totalElements: number
}
