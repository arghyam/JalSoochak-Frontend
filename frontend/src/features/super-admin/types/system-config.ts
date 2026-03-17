export const SYSTEM_SUPPORTED_CHANNELS = ['BFM', 'MAN', 'ELM', 'PDU', 'IOT'] as const
export type SystemSupportedChannel = (typeof SYSTEM_SUPPORTED_CHANNELS)[number]

export interface SystemConfiguration {
  supportedChannels: SystemSupportedChannel[]
  oversupplyThreshold: number
  undersupplyThreshold: number
  bfmImageConfidenceThreshold: number
  locationAffinityThreshold: number
}

export type SaveSystemConfigPayload = SystemConfiguration

// ─── API shape ────────────────────────────────────────────────────────────────

export interface SystemConfigApiResponse {
  SYSTEM_SUPPORTED_CHANNELS?: { channels: string[] }
  WATER_QUANTITY_SUPPLY_THRESHOLD?: {
    undersupplyThresholdPercent: number | null
    oversupplyThresholdPercent: number | null
  }
  BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD?: { value: string }
  LOCATION_AFFINITY_THRESHOLD?: { value: string }
}

export function mapApiResponseToSystemConfig(
  configs: SystemConfigApiResponse
): SystemConfiguration {
  const channels = (configs.SYSTEM_SUPPORTED_CHANNELS?.channels ?? []) as SystemSupportedChannel[]
  const threshold = configs.WATER_QUANTITY_SUPPLY_THRESHOLD
  const rawBfm = Number.parseFloat(
    configs.BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD?.value ?? ''
  )
  const rawLocation = Number.parseFloat(configs.LOCATION_AFFINITY_THRESHOLD?.value ?? '')
  return {
    supportedChannels: channels,
    oversupplyThreshold: threshold?.oversupplyThresholdPercent ?? 0,
    undersupplyThreshold: threshold?.undersupplyThresholdPercent ?? 0,
    bfmImageConfidenceThreshold: Number.isFinite(rawBfm) ? rawBfm : 0,
    locationAffinityThreshold: Number.isFinite(rawLocation) ? rawLocation : 0,
  }
}

export function mapSystemConfigToApiPayload(config: SaveSystemConfigPayload): {
  configs: Record<string, unknown>
} {
  return {
    configs: {
      SYSTEM_SUPPORTED_CHANNELS: { channels: config.supportedChannels },
      WATER_QUANTITY_SUPPLY_THRESHOLD: {
        undersupplyThresholdPercent: config.undersupplyThreshold,
        oversupplyThresholdPercent: config.oversupplyThreshold,
      },
      BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD: {
        value: String(config.bfmImageConfidenceThreshold),
      },
      LOCATION_AFFINITY_THRESHOLD: { value: String(config.locationAffinityThreshold) },
    },
  }
}
