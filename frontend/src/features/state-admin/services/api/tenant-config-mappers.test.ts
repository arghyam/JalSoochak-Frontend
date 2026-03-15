import {
  mapApiConfigToConfigurationData,
  mapApiConfigToEscalationRules,
  mapApiConfigToLanguageConfiguration,
  mapApiConfigToWaterNormsConfiguration,
  mapConfigurationDataToApiConfig,
  mapEscalationRulesToApiConfig,
  mapLanguageConfigToApiConfig,
  mapWaterNormsToApiConfig,
  type TenantConfigMap,
} from './tenant-config-mappers'
import { DEFAULT_METER_CHANGE_REASONS, type SupportedChannel } from '../../types/configuration'

// ---------------------------------------------------------------------------
// Configuration mappers
// ---------------------------------------------------------------------------

describe('mapApiConfigToConfigurationData', () => {
  it('maps a full config response to ConfigurationData', () => {
    const configs: TenantConfigMap = {
      TENANT_SUPPORTED_CHANNELS: { channels: ['BFM', 'ELM'] },
      TENANT_LOGO: 'https://example.com/logo.png',
      METER_CHANGE_REASONS: {
        reasons: [
          { id: 'r1', name: 'Meter Replaced', sequenceOrder: 1 },
          { id: 'r2', name: 'Meter Damaged', sequenceOrder: 2 },
        ],
      },
      LOCATION_CHECK_REQUIRED: { value: 'YES' },
      DATA_CONSOLIDATION_TIME: { timeValue: '14:00', description: null },
      PUMP_OPERATOR_REMINDER_NUDGE_TIME: { nudge: { schedule: { hour: 9, minute: 30 } } },
      AVERAGE_MEMBERS_PER_HOUSEHOLD: { value: '4.5' },
    }

    const result = mapApiConfigToConfigurationData(configs)

    expect(result.supportedChannels).toEqual(['Bulk Flow Meter', 'Electric Meter'])
    expect(result.logoUrl).toBe('https://example.com/logo.png')
    expect(result.meterChangeReasons).toEqual([
      { id: 'r1', name: 'Meter Replaced' },
      { id: 'r2', name: 'Meter Damaged' },
    ])
    expect(result.locationCheckRequired).toBe(true)
    expect(result.dataConsolidationTime).toBe('14:00')
    expect(result.pumpOperatorReminderNudgeTime).toBe('09:30')
    expect(result.averageMembersPerHousehold).toBe(4.5)
    expect(result.isConfigured).toBe(true)
  })

  it('falls back to defaults when keys are absent', () => {
    const result = mapApiConfigToConfigurationData({})

    expect(result.meterChangeReasons).toEqual(DEFAULT_METER_CHANGE_REASONS)
    expect(result.supportedChannels).toEqual([])
    expect(result.locationCheckRequired).toBe(false)
    expect(result.dataConsolidationTime).toBe('')
    expect(result.pumpOperatorReminderNudgeTime).toBe('')
    expect(result.averageMembersPerHousehold).toBe(0)
  })

  it('filters out unknown channel codes', () => {
    const result = mapApiConfigToConfigurationData({
      TENANT_SUPPORTED_CHANNELS: { channels: ['BFM', 'UNKNOWN'] },
    })
    expect(result.supportedChannels).toEqual(['Bulk Flow Meter'])
  })
})

describe('mapConfigurationDataToApiConfig', () => {
  it('converts ConfigurationData to API format', () => {
    const payload = {
      supportedChannels: ['Bulk Flow Meter', 'IOT'] as SupportedChannel[],
      logoUrl: 'https://example.com/logo.png',
      meterChangeReasons: [{ id: 'r1', name: 'Meter Replaced' }],
      locationCheckRequired: false,
      dataConsolidationTime: '18:00',
      pumpOperatorReminderNudgeTime: '08:00',
      averageMembersPerHousehold: 3,
      isConfigured: true,
    }

    const result = mapConfigurationDataToApiConfig(payload)

    expect(result.TENANT_SUPPORTED_CHANNELS).toEqual({ channels: ['BFM', 'IOT'] })
    expect(result.TENANT_LOGO).toBe('https://example.com/logo.png')
    expect(result.METER_CHANGE_REASONS).toEqual({
      reasons: [{ id: 'r1', name: 'Meter Replaced', sequenceOrder: 1 }],
    })
    expect(result.LOCATION_CHECK_REQUIRED).toEqual({ value: 'NO' })
    expect(result.DATA_CONSOLIDATION_TIME).toEqual({ timeValue: '18:00', description: null })
    expect(result.PUMP_OPERATOR_REMINDER_NUDGE_TIME).toEqual({
      nudge: { schedule: { hour: 8, minute: 0 } },
    })
    expect(result.AVERAGE_MEMBERS_PER_HOUSEHOLD).toEqual({ value: '3' })
  })

  it('round-trips: API → frontend → API preserves data', () => {
    const configs: TenantConfigMap = {
      TENANT_SUPPORTED_CHANNELS: { channels: ['BFM', 'MAN'] },
      METER_CHANGE_REASONS: {
        reasons: [
          { id: 'r1', name: 'Reason A', sequenceOrder: 1 },
          { id: 'r2', name: 'Reason B', sequenceOrder: 2 },
        ],
      },
      LOCATION_CHECK_REQUIRED: { value: 'YES' },
      DATA_CONSOLIDATION_TIME: { timeValue: '22:00', description: null },
      PUMP_OPERATOR_REMINDER_NUDGE_TIME: { nudge: { schedule: { hour: 7, minute: 0 } } },
      AVERAGE_MEMBERS_PER_HOUSEHOLD: { value: '5' },
    }

    const frontend = mapApiConfigToConfigurationData(configs)
    const backToApi = mapConfigurationDataToApiConfig(frontend)

    expect(backToApi.TENANT_SUPPORTED_CHANNELS).toEqual({ channels: ['BFM', 'MAN'] })
    expect(backToApi.LOCATION_CHECK_REQUIRED).toEqual({ value: 'YES' })
    expect(backToApi.DATA_CONSOLIDATION_TIME).toEqual({ timeValue: '22:00', description: null })
  })
})

// ---------------------------------------------------------------------------
// Water norms mappers
// ---------------------------------------------------------------------------

describe('mapApiConfigToWaterNormsConfiguration', () => {
  it('maps water norm and threshold values', () => {
    const configs: TenantConfigMap = {
      WATER_NORM: { value: '55' },
      TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD: {
        undersupplyThresholdPercent: 40,
        oversupplyThresholdPercent: 150,
      },
    }

    const result = mapApiConfigToWaterNormsConfiguration(configs)

    expect(result.stateQuantity).toBe(55)
    expect(result.undersupplyThreshold).toBe(40)
    expect(result.oversupplyThreshold).toBe(150)
    expect(result.districtOverrides).toEqual([])
    expect(result.isConfigured).toBe(true)
  })

  it('defaults to 0 when keys are absent', () => {
    const result = mapApiConfigToWaterNormsConfiguration({})
    expect(result.stateQuantity).toBe(0)
    expect(result.undersupplyThreshold).toBe(0)
    expect(result.oversupplyThreshold).toBe(0)
  })

  it('defaults to 0 when threshold values are null', () => {
    const configs: TenantConfigMap = {
      TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD: {
        undersupplyThresholdPercent: null,
        oversupplyThresholdPercent: null,
      },
    }
    const result = mapApiConfigToWaterNormsConfiguration(configs)
    expect(result.undersupplyThreshold).toBe(0)
    expect(result.oversupplyThreshold).toBe(0)
  })
})

describe('mapWaterNormsToApiConfig', () => {
  it('only emits WATER_NORM and TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD', () => {
    const payload = {
      stateQuantity: 60,
      districtOverrides: [{ id: 'd1', districtName: 'Hyderabad', quantity: 70 }],
      oversupplyThreshold: 150,
      undersupplyThreshold: 40,
      isConfigured: true,
    }

    const result = mapWaterNormsToApiConfig(payload)

    expect(result.WATER_NORM).toEqual({ value: '60' })
    expect(result.TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD).toEqual({
      undersupplyThresholdPercent: 40,
      oversupplyThresholdPercent: 150,
    })
    // district overrides must NOT be sent
    expect(result).not.toHaveProperty('districtOverrides')
  })
})

// ---------------------------------------------------------------------------
// Language configuration mappers
// ---------------------------------------------------------------------------

describe('mapApiConfigToLanguageConfiguration', () => {
  it('maps preferences to primary/secondary/tertiary', () => {
    const configs: TenantConfigMap = {
      SUPPORTED_LANGUAGES: {
        languages: [
          { language: 'Hindi', preference: 2 },
          { language: 'English', preference: 1 },
          { language: 'Telugu', preference: 3 },
        ],
      },
    }

    const result = mapApiConfigToLanguageConfiguration(configs)

    expect(result.primaryLanguage).toBe('english')
    expect(result.secondaryLanguage).toBe('hindi')
    expect(result.tertiaryLanguage).toBe('telugu')
    expect(result.isConfigured).toBe(true)
  })

  it('handles single language', () => {
    const configs: TenantConfigMap = {
      SUPPORTED_LANGUAGES: { languages: [{ language: 'English', preference: 1 }] },
    }

    const result = mapApiConfigToLanguageConfiguration(configs)

    expect(result.primaryLanguage).toBe('english')
    expect(result.secondaryLanguage).toBeUndefined()
    expect(result.tertiaryLanguage).toBeUndefined()
  })

  it('returns empty primary when key is absent', () => {
    const result = mapApiConfigToLanguageConfiguration({})
    expect(result.primaryLanguage).toBe('')
  })

  it('sets isConfigured to false when languages array is empty', () => {
    const result = mapApiConfigToLanguageConfiguration({})
    expect(result.isConfigured).toBe(false)
  })

  it('sets isConfigured to false when primaryLanguage resolves to empty', () => {
    const result = mapApiConfigToLanguageConfiguration({
      SUPPORTED_LANGUAGES: { languages: [] },
    })
    expect(result.isConfigured).toBe(false)
  })
})

describe('mapLanguageConfigToApiConfig', () => {
  it('converts language values to API format with preferences', () => {
    const payload = {
      primaryLanguage: 'english',
      secondaryLanguage: 'hindi',
      tertiaryLanguage: undefined,
      isConfigured: true,
    }

    const result = mapLanguageConfigToApiConfig(payload)

    expect(result.SUPPORTED_LANGUAGES?.languages).toEqual([
      { language: 'English', preference: 1 },
      { language: 'Hindi', preference: 2 },
    ])
  })

  it('round-trips: API → frontend → API preserves language order', () => {
    const configs: TenantConfigMap = {
      SUPPORTED_LANGUAGES: {
        languages: [
          { language: 'English', preference: 1 },
          { language: 'Telugu', preference: 2 },
        ],
      },
    }

    const frontend = mapApiConfigToLanguageConfiguration(configs)
    const backToApi = mapLanguageConfigToApiConfig(frontend)

    expect(backToApi.SUPPORTED_LANGUAGES?.languages).toEqual([
      { language: 'English', preference: 1 },
      { language: 'Telugu', preference: 2 },
    ])
  })
})

// ---------------------------------------------------------------------------
// Escalation rules mappers
// ---------------------------------------------------------------------------

describe('mapApiConfigToEscalationRules', () => {
  it('maps escalation rules from API format', () => {
    const configs: TenantConfigMap = {
      FIELD_STAFF_ESCALATION_RULES: {
        escalation: {
          schedule: { hour: 9, minute: 0 },
          level1: { threshold: { days: 3 }, officer: { userType: 'SECTION_OFFICER' } },
          level2: { threshold: { days: 7 }, officer: { userType: 'SUBDIVISION_OFFICER' } },
        },
      },
    }

    const result = mapApiConfigToEscalationRules(configs)

    expect(result.schedule).toEqual({ hour: 9, minute: 0 })
    expect(result.levels).toHaveLength(2)
    expect(result.levels[0]).toEqual({ days: 3, userType: 'SECTION_OFFICER' })
    expect(result.levels[1]).toEqual({ days: 7, userType: 'SUBDIVISION_OFFICER' })
  })

  it('returns empty levels when key is absent', () => {
    const result = mapApiConfigToEscalationRules({})
    expect(result.levels).toEqual([])
    expect(result.schedule).toEqual({ hour: 9, minute: 0 })
  })

  it('sorts levels by number regardless of key order', () => {
    const configs: TenantConfigMap = {
      FIELD_STAFF_ESCALATION_RULES: {
        escalation: {
          schedule: { hour: 8, minute: 30 },
          level2: { threshold: { days: 7 }, officer: { userType: 'SUBDIVISION_OFFICER' } },
          level1: { threshold: { days: 3 }, officer: { userType: 'SECTION_OFFICER' } },
        },
      },
    }

    const result = mapApiConfigToEscalationRules(configs)

    expect(result.levels[0].userType).toBe('SECTION_OFFICER')
    expect(result.levels[1].userType).toBe('SUBDIVISION_OFFICER')
  })
})

describe('mapEscalationRulesToApiConfig', () => {
  it('converts levels array to numbered level keys', () => {
    const payload = {
      schedule: { hour: 9, minute: 0 },
      levels: [
        { days: 3, userType: 'SECTION_OFFICER' as const },
        { days: 7, userType: 'SUBDIVISION_OFFICER' as const },
      ],
    }

    const result = mapEscalationRulesToApiConfig(payload)

    expect(result.FIELD_STAFF_ESCALATION_RULES?.escalation?.schedule).toEqual({
      hour: 9,
      minute: 0,
    })
    expect(result.FIELD_STAFF_ESCALATION_RULES?.escalation?.level1).toEqual({
      threshold: { days: 3 },
      officer: { userType: 'SECTION_OFFICER' },
    })
    expect(result.FIELD_STAFF_ESCALATION_RULES?.escalation?.level2).toEqual({
      threshold: { days: 7 },
      officer: { userType: 'SUBDIVISION_OFFICER' },
    })
  })

  it('handles empty levels', () => {
    const result = mapEscalationRulesToApiConfig({ schedule: { hour: 9, minute: 0 }, levels: [] })
    const escalation = result.FIELD_STAFF_ESCALATION_RULES?.escalation
    expect(escalation?.schedule).toEqual({ hour: 9, minute: 0 })
    expect(Object.keys(escalation ?? {}).filter((k) => k.startsWith('level'))).toHaveLength(0)
  })
})
