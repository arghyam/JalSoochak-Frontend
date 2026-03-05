export interface HierarchyLevel {
  level: number
  name: string
}

export interface MeterChangeReason {
  id: string
  name: string
}

export const SUPPORTED_CHANNELS = [
  'Bulk Flow Meter',
  'Electric Meter',
  'Pump Duration',
  'IOT',
  'Manual',
] as const

export type SupportedChannel = (typeof SUPPORTED_CHANNELS)[number]

export const DEFAULT_LGD_HIERARCHY: HierarchyLevel[] = [
  { level: 1, name: 'State' },
  { level: 2, name: 'District' },
  { level: 3, name: 'Block' },
  { level: 4, name: 'Panchayat' },
  { level: 5, name: 'Village' },
]

export const DEFAULT_DEPARTMENT_HIERARCHY: HierarchyLevel[] = [
  { level: 1, name: 'State' },
  { level: 2, name: 'Zone' },
  { level: 3, name: 'Circle' },
  { level: 4, name: 'Division' },
  { level: 5, name: 'Sub-division' },
]

export const DEFAULT_METER_CHANGE_REASONS: MeterChangeReason[] = [
  { id: 'r1', name: 'Meter Replaced' },
  { id: 'r2', name: 'Meter Not Working' },
  { id: 'r3', name: 'Meter Damaged' },
]

export interface ConfigurationData extends Record<string, unknown> {
  id: string
  lgdHierarchy: HierarchyLevel[]
  departmentHierarchy: HierarchyLevel[]
  supportedChannels: SupportedChannel[]
  logoUrl?: string
  meterChangeReasons: MeterChangeReason[]
  locationCheckRequired: boolean
  dataConsolidationTime: string
  stateDataReconciliationTime: string
  averageMembersPerHousehold: number
  isConfigured: boolean
}
