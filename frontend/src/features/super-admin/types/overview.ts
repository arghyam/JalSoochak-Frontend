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
