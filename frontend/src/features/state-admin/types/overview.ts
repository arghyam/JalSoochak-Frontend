export interface StatItem {
  value: string | number
  subtitle: string
}

export interface OverviewData {
  stats: {
    activeSchemes: StatItem
  }
}

export interface StaffCountsData {
  totalStaff: number
  pumpOperators: number
  sectionOfficers: number
  subDivisionOfficers: number
  totalAdmins: number
}
