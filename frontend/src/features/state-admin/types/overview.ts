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
    activeSchemes: StatItem
  }
}

export interface StaffCountsData {
  totalStaff: number
  pumpOperators: number
  totalAdmins: number
}
