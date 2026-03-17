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

export interface OverviewData {
  stats: {
    configurationStatus: StatItem
    activeStaff: StatItem
    activeSchemes: StatItem
    activeIntegrations: StatItem
  }
}
