export interface MeterChangeReason {
  id: string
  name: string
}

export interface SupplyOutageReason {
  id: string
  name: string
  isDefault: boolean
  editable: boolean
}

export interface DateFormatConfig {
  dateFormat: string | null
  timeFormat: string | null
  timezone: string | null
}

export type KnownSupportedChannel = 'BFM' | 'ELM' | 'PDU' | 'IOT' | 'MAN'

/**
 * Open string union: known codes are autocompleted; unknown backend codes are
 * still representable without unsafe casts.
 */
export type SupportedChannel = KnownSupportedChannel | (string & {})

export const FALLBACK_SYSTEM_CHANNELS: KnownSupportedChannel[] = ['BFM', 'ELM', 'PDU', 'IOT', 'MAN']

export const CHANNEL_CODE_TO_NAME: Partial<Record<KnownSupportedChannel, string>> = {
  BFM: 'Bulk Flow Meter',
  ELM: 'Electric Meter',
  PDU: 'Pump Duration',
  IOT: 'IOT',
  MAN: 'Manual',
}

export const DEFAULT_METER_CHANGE_REASONS: MeterChangeReason[] = [
  { id: 'r1', name: 'Meter Replaced' },
  { id: 'r2', name: 'Meter Not Working' },
  { id: 'r3', name: 'Meter Damaged' },
]

export const DEFAULT_SUPPLY_OUTAGE_REASONS: SupplyOutageReason[] = [
  {
    id: 'ELECTRICITY_SUPPLY_DISCONNECTED',
    name: 'Electricity Supply Disconnected',
    isDefault: true,
    editable: true,
  },
  {
    id: 'NO_ELECTRICITY_SUPPLY_TODAY',
    name: 'No Electricity Supply Today',
    isDefault: true,
    editable: true,
  },
  { id: 'PUMP_FAILURE', name: 'Pump Failure', isDefault: true, editable: true },
  { id: 'PIPELINE_BREAK', name: 'Pipeline Break', isDefault: true, editable: true },
  { id: 'WATER_QUALITY_ISSUES', name: 'Water Quality Issues', isDefault: true, editable: true },
  { id: 'SOURCE_DRYING', name: 'Source Drying', isDefault: true, editable: true },
  { id: 'NATURAL_CALAMITY', name: 'Natural Calamity', isDefault: true, editable: true },
  { id: 'OTHERS', name: 'Others', isDefault: true, editable: false },
]

export const DEFAULT_DATE_FORMAT_CONFIG: DateFormatConfig = {
  dateFormat: null,
  timeFormat: null,
  timezone: null,
}

export interface ConfigurationData {
  id: string
  supportedChannels: SupportedChannel[]
  degraded?: boolean
  removedChannels?: SupportedChannel[]
  logoUrl?: string
  meterChangeReasons: MeterChangeReason[]
  supplyOutageReasons: SupplyOutageReason[]
  locationCheckRequired: boolean
  displayDepartmentMaps: boolean
  dataConsolidationTime: string
  pumpOperatorReminderNudgeTime: string
  dateFormatScreen: DateFormatConfig
  dateFormatTable: DateFormatConfig
  averageMembersPerHousehold: number
  isConfigured: boolean
}
