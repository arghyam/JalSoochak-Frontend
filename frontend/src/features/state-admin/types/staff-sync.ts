export type StaffRole = 'pump-operator' | 'sub-division-officer' | 'section-officer'

export type ActivityStatus = 'active' | 'inactive'

export interface StaffMember {
  id: string
  gramPanchayat: string
  village: string
  name: string
  role: StaffRole
  mobileNumber: string
  lastSubmission: string | null
  activityStatus: ActivityStatus
}

export interface StaffSyncStats {
  totalPumpOperators: number
  totalSubDivisionOfficers: number
  totalSectionOfficers: number
}

export interface VillageOption {
  value: string
  label: string
}

export interface GramPanchayatOption {
  value: string
  label: string
  villages: VillageOption[]
}

export interface StaffSyncData {
  stats: StaffSyncStats
  staff: StaffMember[]
  gramPanchayats: GramPanchayatOption[]
}
