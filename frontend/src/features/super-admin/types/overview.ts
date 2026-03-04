export interface SuperAdminStats {
  totalStatesManaged: number
  activeStates: number
  inactiveStates: number
}

export interface IngestionDataPoint {
  month: string
  successfulIngestions: number
  failedIngestions: number
}

export interface WaterSupplyOutageData {
  /** Label shown on the X-axis (state, district, block, sub-division, village, etc.) */
  label: string
  electricityFailure: number
  pipelineLeak: number
  pumpFailure: number
  valveIssue: number
  sourceDrying: number
}

export interface SuperAdminOverviewData {
  stats: SuperAdminStats
  ingestionData: IngestionDataPoint[]
  waterSupplyOutages: WaterSupplyOutageData[]
}
