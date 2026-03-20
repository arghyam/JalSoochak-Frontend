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
  block: string | null
  village: string | null
  reportingRate: number | null
  photoCompliance: number
  waterSupplied: number | null
}

export interface VillagePumpOperatorDetails {
  id?: number
  uuid?: string
  mappingKey?: string
  name: string
  email?: string
  phoneNumber?: string
  status?: number | string
  schemeId?: number
  schemeName?: string
  schemeLatitude?: number | null
  schemeLongitude?: number | null
  lastSubmissionAt?: string | null
  firstSubmissionDate?: string | null
  totalDaysSinceFirstSubmission?: number | null
  submittedDays?: number
  reportingRatePercent?: number | null
  missedSubmissionDays?: number | null
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

export interface NationalDashboardQueryParams {
  startDate: string
  endDate: string
}

export interface NationalDashboardQuantityPerformanceItem {
  tenantId: number
  stateCode: string
  stateTitle: string
  schemeCount: number
  totalHouseholdCount: number
  totalFhtcCount?: number
  totalPlannedFhtc?: number
  totalWaterSuppliedLiters: number
  avgWaterSupplyPerScheme: number
}

export interface NationalDashboardRegularityItem {
  tenantId: number
  stateCode: string
  stateTitle: string
  schemeCount: number
  totalSupplyDays: number
  averageRegularity: number
}

export interface NationalDashboardReadingSubmissionRateItem {
  tenantId: number
  stateCode: string
  stateTitle: string
  schemeCount: number
  totalSubmissionDays: number
  readingSubmissionRate: number
}

export type NationalDashboardOutageReasonDistribution = Record<string, number>

export interface NationalDashboardResponse {
  startDate: string
  endDate: string
  daysInRange: number
  stateWiseQuantityPerformance: NationalDashboardQuantityPerformanceItem[]
  stateWiseRegularity: NationalDashboardRegularityItem[]
  stateWiseReadingSubmissionRate: NationalDashboardReadingSubmissionRateItem[]
  overallOutageReasonDistribution: NationalDashboardOutageReasonDistribution
}

export interface AverageWaterSupplyScheme {
  schemeId: number
  schemeName: string
  householdCount: number
  fhtcCount?: number
  plannedFhtc?: number
  totalWaterSuppliedLiters: number
  supplyDays: number
  avgLitersPerHousehold: number
}

export interface AverageWaterSupplyChildRegion {
  lgdId: number
  departmentId: number
  title: string
  totalHouseholdCount: number
  totalFhtcCount?: number
  totalPlannedFhtc?: number
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

export interface AverageSchemeRegularityQueryParams {
  parentLgdId?: number
  parentDepartmentId?: number
  scope?: 'current' | 'child'
  startDate: string
  endDate: string
}

export interface AverageSchemeRegularityChildRegion {
  lgdId: number
  departmentId: number
  title: string
  schemeCount: number
  totalSupplyDays: number
  averageRegularity: number
}

export interface AverageSchemeRegularityResponse {
  lgdId: number
  parentDepartmentId: number
  parentLgdLevel: number
  parentDepartmentLevel: number
  scope: string
  startDate: string
  endDate: string
  daysInRange: number
  schemeCount: number
  totalSupplyDays: number
  averageRegularity: number
  childRegionCount: number
  childRegions: AverageSchemeRegularityChildRegion[]
}

export interface ReadingSubmissionRateQueryParams {
  parentLgdId?: number
  parentDepartmentId?: number
  scope?: 'current' | 'child'
  startDate: string
  endDate: string
}

export interface ReadingComplianceQueryParams {
  tenant_code: string
  scheme_id?: number
  page?: number
  size?: number
}

export interface ReadingComplianceItem {
  id: number
  uuid: string
  name: string
  email?: string
  phoneNumber?: string
  status?: string
  schemeId?: number
  schemeName?: string
  schemeMappingStatus?: number
  onboardingDate?: string | null
  totalActiveDays?: number | null
  submittedDays?: number | null
  missedSubmissionDays?: number | string[] | null
  inactiveDays?: number | null
  missingSubmissionCount?: number | null
  reportingRatePercent?: number | null
  readingDate?: string | null
  readingAt?: string | null
  lastSubmissionAt: string | null
  confirmedReading: number | null
}

export interface ReadingComplianceResponse {
  status: number
  message: string
  data: {
    content: ReadingComplianceItem[]
  }
}

export interface SchemePerformanceQueryParams {
  parentLgdId?: number
  parentDepartmentId?: number
  startDate: string
  endDate: string
  schemeCount?: number
}

export interface PumpOperatorDetailsQueryParams {
  pumpOperatorId: number
  tenant_code: string
}

export interface PumpOperatorsBySchemeQueryParams {
  tenant_code: string
  scheme_id: number
}

export interface PumpOperatorsBySchemeItem {
  schemeId: number
  schemeName: string
  pumpOperators: Array<{
    id: number
    uuid: string
    name: string
    email: string
    phoneNumber: string
    status: number
  }>
}

export interface PumpOperatorsBySchemeResponse {
  status: number
  message: string
  data: PumpOperatorsBySchemeItem[]
}

export interface PumpOperatorDetailsResponse {
  status: number
  message: string
  data: {
    id: number
    uuid: string
    name: string
    email: string
    phoneNumber: string
    status: number
    schemeId: number
    schemeName: string
    schemeLatitude: number | null
    schemeLongitude: number | null
    lastSubmissionAt: string | null
    firstSubmissionDate: string | null
    totalDaysSinceFirstSubmission: number | null
    submittedDays: number
    reportingRatePercent: number | null
    missedSubmissionDays: number | null
    inactiveDays?: number | null
  }
}

export interface SchemePerformanceItem {
  schemeId: number
  schemeName: string
  statusCode: number
  status: string
  submissionDays: number
  reportingRate: number
  totalWaterSupplied: number
  immediateParentLgdId: number
  immediateParentLgdCName: string
  immediateParentLgdTitle: string
  immediateParentDepartmentId: number
  immediateParentDepartmentCName: string
  immediateParentDepartmentTitle: string
}

export interface SchemePerformanceResponse {
  parentLgdId: number
  parentDepartmentId: number
  parentLgdCName: string
  parentDepartmentCName: string
  parentLgdTitle: string
  parentDepartmentTitle: string
  startDate: string
  endDate: string
  daysInRange: number
  activeSchemeCount: number
  inactiveSchemeCount: number
  topSchemeCount: number
  topSchemes: SchemePerformanceItem[]
}

export interface ReadingSubmissionRateChildRegion {
  lgdId: number
  departmentId: number
  title: string
  schemeCount: number
  totalSubmissionDays: number
  readingSubmissionRate: number
}

export interface ReadingSubmissionRateResponse {
  parentLgdId: number
  parentDepartmentId: number
  parentLgdLevel: number
  parentDepartmentLevel: number
  scope: string
  startDate: string
  endDate: string
  daysInRange: number
  schemeCount: number
  totalSubmissionDays: number
  readingSubmissionRate: number
  childRegionCount: number
  childRegions: ReadingSubmissionRateChildRegion[]
}

export interface SubmissionStatusQueryParams {
  userId?: number
  startDate: string
  endDate: string
}

export interface SubmissionStatusDailySchemeDistribution {
  date: string
  submittedSchemeCount: number
}

export interface SubmissionStatusResponse {
  userId: number
  startDate: string
  endDate: string
  schemeCount: number
  compliantSubmissionCount: number
  anomalousSubmissionCount: number
  dailySubmissionSchemeDistribution: SubmissionStatusDailySchemeDistribution[]
}

export interface OutageReasonsQueryParams {
  startDate: string
  endDate: string
  parentLgdId?: number
  parentDepartmentId?: number
}

export interface OutageReasonSchemeCount {
  [reason: string]: number
}

export interface OutageReasonsChildRegion {
  lgdId: number
  departmentId: number
  title: string
  outageReasonSchemeCount: OutageReasonSchemeCount
}

export interface OutageReasonsResponse {
  lgdId: number
  departmentId: number
  startDate: string
  endDate: string
  parentLgdLevel: number
  parentDepartmentLevel: number
  outageReasonSchemeCount: OutageReasonSchemeCount
  childRegionCount: number
  childRegions: OutageReasonsChildRegion[]
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
