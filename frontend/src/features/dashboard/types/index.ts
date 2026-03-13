export type DashboardLevel =
  | 'central'
  | 'state'
  | 'district'
  | 'block'
  | 'gram-panchayat'
  | 'village'
  | 'zone'
  | 'circle'
  | 'division'
  | 'sub-division'

export type EntityStatus = 'good' | 'needs-attention' | 'critical'

export interface KPIData {
  totalSchemes: number
  totalRuralHouseholds: number
  functionalTapConnections: number
}

export interface EntityPerformance {
  id: string
  name: string
  coverage: number
  regularity: number
  continuity: number
  quantity: number
  compositeScore: number
  status: EntityStatus
}

export interface DemandSupplyData {
  period: string
  demand: number
  supply: number
}

export interface ReadingSubmissionStatusData {
  label: string
  value: number
}

export interface PumpOperatorsData {
  label: string
  value: number
}

export interface ReadingComplianceData {
  id: string
  name: string
  village: string
  lastSubmission: string
  readingValue: string
}

export interface PumpOperatorPerformanceData {
  id: string
  name: string
  block: string
  village: string
  reportingRate: number
  photoCompliance: number
  waterSupplied: number
}

export interface VillagePumpOperatorDetails {
  name: string
  scheme: string
  stationLocation: string
  lastSubmission: string
  reportingRate: string
  missingSubmissionCount: string
  inactiveDays: string
}

export interface WaterSupplyOutageData {
  label: string
  electricityFailure: number
  pipelineLeak: number
  pumpFailure: number
  valveIssue: number
  sourceDrying: number
}

export interface ReadingSubmissionTrendData {
  period: string
  value: number
}

export interface SupplyOutageTrendData {
  period: string
  value: number
}

export interface DashboardData {
  level: DashboardLevel
  entityId?: string
  entityName?: string
  kpis: KPIData
  mapData: EntityPerformance[]
  demandSupply: DemandSupplyData[]
  readingSubmissionStatus: ReadingSubmissionStatusData[]
  readingCompliance: ReadingComplianceData[]
  pumpOperators: PumpOperatorsData[]
  waterSupplyOutages: WaterSupplyOutageData[]
  supplyOutageTrend?: SupplyOutageTrendData[]
  readingSubmissionTrend?: ReadingSubmissionTrendData[]
  topPerformers: EntityPerformance[]
  worstPerformers: EntityPerformance[]
  regularityData: EntityPerformance[]
  continuityData: EntityPerformance[]
  leadingPumpOperators?: PumpOperatorPerformanceData[]
  bottomPumpOperators?: PumpOperatorPerformanceData[]
}

export interface StateUtOption {
  value: string
  label: string
  tenantId?: number
  tenantCode?: string
}

export interface StateUtSearchResponse {
  totalStatesCount: number
  states: StateUtOption[]
}

export interface AverageWaterSupplyPerRegionQueryParams {
  tenantId: number
  parentLgdId?: number
  parentDepartmentId?: number
  scope?: 'current' | 'child'
  startDate: string
  endDate: string
}

export interface AverageWaterSupplyScheme {
  schemeId: number
  schemeName: string
  householdCount: number
  totalWaterSuppliedLiters: number
  supplyDays: number
  avgLitersPerHousehold: number
}

export interface AverageWaterSupplyChildRegion {
  lgdId: number
  departmentId: number
  title: string
  totalHouseholdCount: number
  totalWaterSuppliedLiters: number
  schemeCount: number
  avgWaterSupplyPerScheme: number
}

export interface AverageWaterSupplyPerRegionResponse {
  tenantId: number
  stateCode: string
  parentLgdLevel: number
  parentDepartmentLevel: number
  startDate: string
  endDate: string
  daysInRange: number
  schemeCount: number
  childRegionCount: number
  schemes: AverageWaterSupplyScheme[]
  childRegions: AverageWaterSupplyChildRegion[]
}

// For map hover/click interactions
export interface MapInteraction {
  entityId: string
  entityName: string
  metrics: {
    coverage: number
    regularity: number
    continuity: number
    quantity: number
  }
}
