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

export const CHANNEL_CODE_TO_NAME = {
  BFM: 'Bulk Flow Meter',
  ELM: 'Electric Meter',
  PDU: 'Pump Duration',
  IOT: 'IOT',
  MAN: 'Manual',
} as const satisfies Record<string, SupportedChannel>

export const CHANNEL_NAME_TO_CODE = Object.fromEntries(
  Object.entries(CHANNEL_CODE_TO_NAME).map(([code, name]) => [name, code])
) as Record<SupportedChannel, keyof typeof CHANNEL_CODE_TO_NAME>

export type SupportedChannelCode = keyof typeof CHANNEL_CODE_TO_NAME

export const DEFAULT_METER_CHANGE_REASONS: MeterChangeReason[] = [
  { id: 'r1', name: 'Meter Replaced' },
  { id: 'r2', name: 'Meter Not Working' },
  { id: 'r3', name: 'Meter Damaged' },
]

export interface ConfigurationData {
  id: string
  supportedChannels: SupportedChannel[]
  logoUrl?: string
  meterChangeReasons: MeterChangeReason[]
  locationCheckRequired: boolean
  dataConsolidationTime: string
  pumpOperatorReminderNudgeTime: string
  averageMembersPerHousehold: number
  isConfigured: boolean
}
