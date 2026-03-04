export interface StatItem {
  value: string | number
  subtitle: string
}

export interface StatsCard {
  id: string
  title: string
  value: string | number
  subtitle?: string
}

export interface DemandSupplyDataPoint {
  period: string
  Demand: number
  Supply: number
}

export interface DailyIngestionDataPoint {
  day: string
  count: number
}

export interface WaterSupplyOutageData {
  /** Label shown on the X-axis (district, block, sub-division, etc.) */
  label: string
  electricityFailure: number
  pipelineLeak: number
  pumpFailure: number
  valveIssue: number
  sourceDrying: number
}

export interface OverviewData {
  stats: {
    configurationStatus: StatItem
    activeStaff: StatItem
    activeSchemes: StatItem
    activeIntegrations: StatItem
  }
  demandSupplyData: DemandSupplyDataPoint[]
  dailyIngestionData: DailyIngestionDataPoint[]
  waterSupplyOutages: WaterSupplyOutageData[]
}
