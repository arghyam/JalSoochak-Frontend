export const SYSTEM_SUPPORTED_CHANNELS = ['BFM', 'MAN', 'ELM', 'PDU', 'IOT'] as const
export type SystemSupportedChannel = (typeof SYSTEM_SUPPORTED_CHANNELS)[number]

export interface SystemConfiguration {
  supportedChannels: SystemSupportedChannel[]
  /** Both max and min read from WATER_QUANTITY_SUPPLY_THRESHOLD.value until backend supports separate bounds */
  waterQuantityMaxThreshold: number
  waterQuantityMinThreshold: number
  bfmImageConfidenceThreshold: number
  locationAffinityThreshold: number
}

export type SaveSystemConfigPayload = SystemConfiguration

// ─── API shape ────────────────────────────────────────────────────────────────

export interface SystemConfigApiResponse {
  SYSTEM_SUPPORTED_CHANNELS?: { channels: string[] }
  WATER_QUANTITY_SUPPLY_THRESHOLD?: { value: string }
  BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD?: { value: string }
  LOCATION_AFFINITY_THRESHOLD?: { value: string }
}

export function mapApiResponseToSystemConfig(
  configs: SystemConfigApiResponse
): SystemConfiguration {
  const channels = (configs.SYSTEM_SUPPORTED_CHANNELS?.channels ?? []) as SystemSupportedChannel[]
  const rawQuantity = Number.parseFloat(configs.WATER_QUANTITY_SUPPLY_THRESHOLD?.value ?? '')
  const quantityValue = Number.isFinite(rawQuantity) ? rawQuantity : 0
  const rawBfm = Number.parseFloat(
    configs.BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD?.value ?? ''
  )
  const rawLocation = Number.parseFloat(configs.LOCATION_AFFINITY_THRESHOLD?.value ?? '')
  return {
    supportedChannels: channels,
    waterQuantityMaxThreshold: quantityValue,
    waterQuantityMinThreshold: quantityValue,
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
      // max is used as the single threshold value; min is a UI-only placeholder for future backend support
      WATER_QUANTITY_SUPPLY_THRESHOLD: { value: String(config.waterQuantityMaxThreshold) },
      BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD: {
        value: String(config.bfmImageConfidenceThreshold),
      },
      LOCATION_AFFINITY_THRESHOLD: { value: String(config.locationAffinityThreshold) },
    },
  }
}
