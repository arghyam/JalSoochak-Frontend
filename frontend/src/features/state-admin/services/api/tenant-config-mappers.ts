/**
 * Mappers between the tenant config API format and frontend types.
 *
 * The tenant config API uses a flat key-value structure:
 *   GET  /api/v1/tenants/{id}/config            → { configs: { KEY: value, ... } }
 *   PUT  /api/v1/tenants/{id}/config            ← { configs: { KEY: value, ... } }
 *
 */

import type { IntegrationConfiguration } from '../../types/integration'
import type {
  ConfigurationData,
  MeterChangeReason,
  SupportedChannel,
} from '../../types/configuration'
import type { MessageTemplatesData, ScreenContent, ScreenName } from '../../types/message-templates'
import { SCREEN_NAMES } from '../../types/message-templates'
import {
  CHANNEL_CODE_TO_NAME,
  CHANNEL_NAME_TO_CODE,
  DEFAULT_METER_CHANGE_REASONS,
} from '../../types/configuration'
import type { EscalationRuleLevel, EscalationRulesConfig } from '../../types/escalation-rules'
import type { LanguageConfiguration } from '../../types/language'
import { APP_LANGUAGES } from '@/shared/constants/languages'
import type { WaterNormsConfiguration } from '../../types/water-norms'

// ---------------------------------------------------------------------------
// Raw API shape (what the backend sends inside configs: { ... })
// ---------------------------------------------------------------------------

interface ApiEscalationLevel {
  threshold: { days: number }
  officer: { userType: string }
}

interface ApiEscalationRules {
  escalation: {
    schedule: { hour: number; minute: number }
    [levelKey: string]: ApiEscalationLevel | { hour: number; minute: number }
  }
}

export interface TenantConfigMap {
  TENANT_SUPPORTED_CHANNELS?: { channels: string[] }
  TENANT_LOGO?: string // URL string
  METER_CHANGE_REASONS?: { reasons: { id: string; name: string; sequenceOrder: number }[] }
  LOCATION_CHECK_REQUIRED?: { value: 'YES' | 'NO' }
  DATA_CONSOLIDATION_TIME?: { timeValue: string; description: string | null }
  PUMP_OPERATOR_REMINDER_NUDGE_TIME?: { nudge: { schedule: { hour: number; minute: number } } }
  AVERAGE_MEMBERS_PER_HOUSEHOLD?: { value: string }
  SUPPORTED_LANGUAGES?: { languages: { language: string; preference: number }[] }
  WATER_NORM?: { value: string }
  TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD?: {
    undersupplyThresholdPercent: number | null
    oversupplyThresholdPercent: number | null
  }
  FIELD_STAFF_ESCALATION_RULES?: ApiEscalationRules
  MESSAGE_BROKER_CONNECTION_SETTINGS?: { apiUrl: string; apiKey?: string; organizationId: string }
  GLIFIC_MESSAGE_TEMPLATES?: {
    version: number
    screens: Record<
      string,
      {
        prompt: Record<string, string | null> | null
        options: Record<string, { order: number; label: Record<string, string | null> }> | null
        reasons: Record<string, { order: number; label: Record<string, string | null> }> | null
        confirmationTemplate: Record<string, string | null> | null
        message: Record<string, string | null> | null
      }
    >
  }
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

function parseHHmm(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number)
  return { hour: h ?? 0, minute: m ?? 0 }
}

function formatHHmm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Configuration page mappers
// ---------------------------------------------------------------------------

export function mapApiConfigToConfigurationData(
  configs: TenantConfigMap
): Omit<ConfigurationData, 'id'> {
  const channelCodes = configs.TENANT_SUPPORTED_CHANNELS?.channels ?? []
  const supportedChannels = channelCodes
    .map((code) => CHANNEL_CODE_TO_NAME[code as keyof typeof CHANNEL_CODE_TO_NAME])
    .filter((c): c is SupportedChannel => Boolean(c))

  const meterReasons: MeterChangeReason[] = configs.METER_CHANGE_REASONS?.reasons?.length
    ? configs.METER_CHANGE_REASONS.reasons.map((r) => ({ id: r.id, name: r.name }))
    : DEFAULT_METER_CHANGE_REASONS

  const nudgeSchedule = configs.PUMP_OPERATOR_REMINDER_NUDGE_TIME?.nudge?.schedule

  return {
    supportedChannels,
    meterChangeReasons: meterReasons,
    locationCheckRequired: configs.LOCATION_CHECK_REQUIRED?.value === 'YES',
    dataConsolidationTime: configs.DATA_CONSOLIDATION_TIME?.timeValue ?? '',
    pumpOperatorReminderNudgeTime: nudgeSchedule
      ? formatHHmm(nudgeSchedule.hour, nudgeSchedule.minute)
      : '',
    averageMembersPerHousehold: Number(configs.AVERAGE_MEMBERS_PER_HOUSEHOLD?.value) || 0,
    isConfigured: true,
  }
}

export function mapConfigurationDataToApiConfig(
  payload: Omit<ConfigurationData, 'id'>
): TenantConfigMap {
  const channelCodes = payload.supportedChannels.map((name) => CHANNEL_NAME_TO_CODE[name])

  const { hour, minute } = parseHHmm(payload.pumpOperatorReminderNudgeTime)

  return {
    TENANT_SUPPORTED_CHANNELS: { channels: channelCodes },
    METER_CHANGE_REASONS: {
      reasons: payload.meterChangeReasons.map((r, i) => ({
        id: r.id,
        name: r.name,
        sequenceOrder: i + 1,
      })),
    },
    LOCATION_CHECK_REQUIRED: { value: payload.locationCheckRequired ? 'YES' : 'NO' },
    DATA_CONSOLIDATION_TIME: { timeValue: payload.dataConsolidationTime, description: null },
    PUMP_OPERATOR_REMINDER_NUDGE_TIME: { nudge: { schedule: { hour, minute } } },
    AVERAGE_MEMBERS_PER_HOUSEHOLD: { value: String(payload.averageMembersPerHousehold) },
  }
}

// ---------------------------------------------------------------------------
// Water norms mappers
// ---------------------------------------------------------------------------

export function mapApiConfigToWaterNormsConfiguration(
  configs: TenantConfigMap
): Omit<WaterNormsConfiguration, 'id'> {
  const waterNorm = configs.WATER_NORM
  const threshold = configs.TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD

  const hasWaterNorm = waterNorm?.value != null
  const hasThreshold =
    threshold != null &&
    threshold.undersupplyThresholdPercent != null &&
    threshold.oversupplyThresholdPercent != null

  if (!hasWaterNorm || !hasThreshold) {
    return {
      stateQuantity: hasWaterNorm ? Number(waterNorm!.value) || 0 : 0,
      districtOverrides: [],
      oversupplyThreshold: null,
      undersupplyThreshold: null,
      isConfigured: false,
    }
  }

  return {
    stateQuantity: Number(waterNorm!.value) || 0,
    districtOverrides: [],
    oversupplyThreshold: threshold!.oversupplyThresholdPercent,
    undersupplyThreshold: threshold!.undersupplyThresholdPercent,
    isConfigured: true,
  }
}

export function mapWaterNormsToApiConfig(
  payload: Omit<WaterNormsConfiguration, 'id'>
): TenantConfigMap {
  // district overrides are intentionally excluded — not yet supported by backend
  return {
    WATER_NORM: { value: String(payload.stateQuantity) },
    TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD: {
      undersupplyThresholdPercent: payload.undersupplyThreshold,
      oversupplyThresholdPercent: payload.oversupplyThreshold,
    },
  }
}

// ---------------------------------------------------------------------------
// Language configuration mappers
// ---------------------------------------------------------------------------

function languageApiNameToValue(apiName: string): string {
  const normalized = apiName.toLowerCase()
  const found = APP_LANGUAGES.find((l) => l.label.toLowerCase() === normalized)
  return found?.label.toLowerCase() ?? normalized
}

function languageValueToApiName(value: string): string {
  const found = APP_LANGUAGES.find((l) => l.label.toLowerCase() === value)
  return found?.label ?? value
}

export function mapApiConfigToLanguageConfiguration(
  configs: TenantConfigMap
): Omit<LanguageConfiguration, 'id'> {
  const languages = [...(configs.SUPPORTED_LANGUAGES?.languages ?? [])].sort(
    (a, b) => a.preference - b.preference
  )

  const primaryLanguage = languages.length > 0 ? languageApiNameToValue(languages[0].language) : ''

  return {
    primaryLanguage,
    secondaryLanguage: languages[1] ? languageApiNameToValue(languages[1].language) : undefined,
    tertiaryLanguage: languages[2] ? languageApiNameToValue(languages[2].language) : undefined,
    isConfigured: Boolean(primaryLanguage),
  }
}

export function mapLanguageConfigToApiConfig(
  payload: Omit<LanguageConfiguration, 'id'>
): TenantConfigMap {
  const languages: { language: string; preference: number }[] = []
  if (payload.primaryLanguage) {
    languages.push({ language: languageValueToApiName(payload.primaryLanguage), preference: 1 })
  }
  if (payload.secondaryLanguage) {
    languages.push({ language: languageValueToApiName(payload.secondaryLanguage), preference: 2 })
  }
  if (payload.tertiaryLanguage) {
    languages.push({ language: languageValueToApiName(payload.tertiaryLanguage), preference: 3 })
  }

  return { SUPPORTED_LANGUAGES: { languages } }
}

// ---------------------------------------------------------------------------
// Escalation rules mappers
// ---------------------------------------------------------------------------

export function mapApiConfigToEscalationRules(configs: TenantConfigMap): EscalationRulesConfig {
  const apiRules = configs.FIELD_STAFF_ESCALATION_RULES?.escalation

  if (!apiRules) {
    return { schedule: { hour: 9, minute: 0 }, levels: [] }
  }

  const { schedule, ...rest } = apiRules
  const sch = schedule as { hour: number; minute: number }

  const levels: EscalationRuleLevel[] = Object.keys(rest)
    .filter((k) => /^level\d+$/.test(k))
    .sort((a, b) => {
      const numA = parseInt(a.replace('level', ''), 10)
      const numB = parseInt(b.replace('level', ''), 10)
      return numA - numB
    })
    .map((k) => {
      const level = rest[k] as ApiEscalationLevel
      return {
        days: level.threshold.days,
        userType: level.officer.userType as EscalationRuleLevel['userType'],
      }
    })

  return { schedule: { hour: sch.hour, minute: sch.minute }, levels }
}

export function mapEscalationRulesToApiConfig(payload: EscalationRulesConfig): TenantConfigMap {
  const levelEntries: Record<string, ApiEscalationLevel> = {}

  payload.levels.forEach((level, i) => {
    levelEntries[`level${i + 1}`] = {
      threshold: { days: level.days },
      officer: { userType: level.userType },
    }
  })

  return {
    FIELD_STAFF_ESCALATION_RULES: {
      escalation: {
        schedule: payload.schedule,
        ...levelEntries,
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Integration configuration mappers
// ---------------------------------------------------------------------------

export function mapApiConfigToIntegrationConfiguration(
  configs: TenantConfigMap
): Omit<IntegrationConfiguration, 'id'> {
  const settings = configs.MESSAGE_BROKER_CONNECTION_SETTINGS
  return {
    apiUrl: settings?.apiUrl ?? '',
    apiKey: settings?.apiKey ?? '',
    organizationId: settings?.organizationId ?? '',
    isConfigured: !!settings?.apiUrl,
  }
}

export function mapIntegrationConfigToApiConfig(
  payload: Omit<IntegrationConfiguration, 'id' | 'isConfigured' | 'apiKey'> & { apiKey?: string }
): TenantConfigMap {
  const settings: { apiUrl: string; organizationId: string; apiKey?: string } = {
    apiUrl: payload.apiUrl as string,
    organizationId: payload.organizationId as string,
  }
  if (payload.apiKey) {
    settings.apiKey = payload.apiKey
  }
  return { MESSAGE_BROKER_CONNECTION_SETTINGS: settings }
}

// ---------------------------------------------------------------------------
// Message templates mapper
// ---------------------------------------------------------------------------

export function mapApiConfigToMessageTemplates(configs: TenantConfigMap): MessageTemplatesData {
  const raw = configs.GLIFIC_MESSAGE_TEMPLATES
  const supportedLanguages = configs.SUPPORTED_LANGUAGES?.languages ?? []

  if (!raw?.screens) {
    return { screens: {}, supportedLanguages }
  }

  const screens: Partial<Record<ScreenName, ScreenContent>> = {}

  for (const key of SCREEN_NAMES) {
    const rawScreen = raw.screens[key]
    if (!rawScreen) continue

    screens[key] = {
      prompt: (rawScreen.prompt as ScreenContent['prompt']) ?? null,
      options: rawScreen.options ? (rawScreen.options as ScreenContent['options']) : null,
      reasons: rawScreen.reasons ? (rawScreen.reasons as ScreenContent['reasons']) : null,
      confirmationTemplate:
        (rawScreen.confirmationTemplate as ScreenContent['confirmationTemplate']) ?? null,
      message: (rawScreen.message as ScreenContent['message']) ?? null,
    }
  }

  return { screens, supportedLanguages }
}
