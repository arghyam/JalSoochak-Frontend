/**
 * Mappers between the tenant config API format and frontend types.
 *
 * The tenant config API uses a flat key-value structure:
 *   GET  /api/v1/tenants/{id}/config            → { configs: { KEY: value, ... } }
 *   PUT  /api/v1/tenants/{id}/config            ← { configs: { KEY: value, ... } }
 *
 */

import type { IntegrationConfiguration } from '../../types/integration'
import type { ConfigurationData, MeterChangeReason } from '../../types/configuration'
import type { MessageTemplatesData, ScreenContent, ScreenName } from '../../types/message-templates'
import { SCREEN_NAMES } from '../../types/message-templates'
import {
  CHANNEL_CODE_TO_NAME,
  CHANNEL_NAME_TO_CODE,
  DEFAULT_DEPARTMENT_HIERARCHY,
  DEFAULT_LGD_HIERARCHY,
  DEFAULT_METER_CHANGE_REASONS,
} from '../../types/configuration'
import type { EscalationRuleLevel, EscalationRulesConfig } from '../../types/escalation-rules'
import type { LanguageConfiguration } from '../../types/language'
import { APP_LANGUAGES } from '@/shared/constants/languages'
import type { WaterNormsConfiguration } from '../../types/water-norms'

// ---------------------------------------------------------------------------
// Raw API shape (what the backend sends inside configs: { ... })
// ---------------------------------------------------------------------------

interface ApiHierarchyLevel {
  level: number
  levelName: { title: string }[]
}

interface ApiHierarchy {
  locationHierarchy: ApiHierarchyLevel[]
}

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
  TENANT_SUPPORTED_CHANNELS?: string[] // TODO: verify — assumed string[] of channel codes
  TENANT_LOGO?: string // URL string
  METER_CHANGE_REASONS?: string[] // TODO: verify — assumed string[]
  LOCATION_CHECK_REQUIRED?: boolean // TODO: verify — assumed boolean
  DATA_CONSOLIDATION_TIME?: string // TODO: verify — assumed "HH:mm" string
  PUMP_OPERATOR_REMINDER_NUDGE_TIME?: string // TODO: verify — assumed "HH:mm" string
  AVERAGE_MEMBERS_PER_HOUSEHOLD?: number // TODO: verify — assumed plain number
  LGD_LOCATION_HIERARCHY?: ApiHierarchy
  DEPT_LOCATION_HIERARCHY?: ApiHierarchy
  SUPPORTED_LANGUAGES?: { languages: { language: string; preference: number }[] }
  WATER_NORM?: number // TODO: verify — assumed plain number (litres)
  TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD?: { value: string }
  FIELD_STAFF_ESCALATION_RULES?: ApiEscalationRules
  MESSAGE_BROKER_CONNECTION_SETTINGS?: { apiUrl: string; apiKey: string; organizationId: string }
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
// Hierarchy helpers
// ---------------------------------------------------------------------------

function mapApiHierarchy(
  apiHierarchy: ApiHierarchy | undefined,
  defaults: typeof DEFAULT_LGD_HIERARCHY
) {
  if (!apiHierarchy?.locationHierarchy?.length) return defaults
  return apiHierarchy.locationHierarchy.map((l) => ({
    level: l.level,
    name: l.levelName?.[0]?.title ?? '',
  }))
}

function mapHierarchyToApi(levels: { level: number; name: string }[]): ApiHierarchy {
  return {
    locationHierarchy: levels.map((l) => ({
      level: l.level,
      levelName: [{ title: l.name }],
    })),
  }
}

// ---------------------------------------------------------------------------
// Configuration page mappers
// ---------------------------------------------------------------------------

export function mapApiConfigToConfigurationData(
  configs: TenantConfigMap
): Omit<ConfigurationData, 'id'> {
  const channelCodes = configs.TENANT_SUPPORTED_CHANNELS ?? []
  const supportedChannels = channelCodes
    .map((code) => CHANNEL_CODE_TO_NAME[code as keyof typeof CHANNEL_CODE_TO_NAME])
    .filter(Boolean) as ConfigurationData['supportedChannels']

  const meterReasons: MeterChangeReason[] = configs.METER_CHANGE_REASONS?.length
    ? configs.METER_CHANGE_REASONS.map((name, i) => ({ id: `r${i + 1}`, name }))
    : DEFAULT_METER_CHANGE_REASONS

  return {
    lgdHierarchy: mapApiHierarchy(configs.LGD_LOCATION_HIERARCHY, DEFAULT_LGD_HIERARCHY),
    departmentHierarchy: mapApiHierarchy(
      configs.DEPT_LOCATION_HIERARCHY,
      DEFAULT_DEPARTMENT_HIERARCHY
    ),
    supportedChannels,
    logoUrl: configs.TENANT_LOGO,
    meterChangeReasons: meterReasons,
    locationCheckRequired: configs.LOCATION_CHECK_REQUIRED ?? false,
    dataConsolidationTime: configs.DATA_CONSOLIDATION_TIME ?? '',
    pumpOperatorReminderNudgeTime: configs.PUMP_OPERATOR_REMINDER_NUDGE_TIME ?? '',
    averageMembersPerHousehold: configs.AVERAGE_MEMBERS_PER_HOUSEHOLD ?? 0,
    isConfigured: true,
  }
}

export function mapConfigurationDataToApiConfig(
  payload: Omit<ConfigurationData, 'id'>
): TenantConfigMap {
  const channelCodes = payload.supportedChannels.map((name) => CHANNEL_NAME_TO_CODE[name])

  return {
    TENANT_SUPPORTED_CHANNELS: channelCodes,
    TENANT_LOGO: payload.logoUrl,
    METER_CHANGE_REASONS: payload.meterChangeReasons.map((r) => r.name),
    LOCATION_CHECK_REQUIRED: payload.locationCheckRequired,
    DATA_CONSOLIDATION_TIME: payload.dataConsolidationTime,
    PUMP_OPERATOR_REMINDER_NUDGE_TIME: payload.pumpOperatorReminderNudgeTime,
    AVERAGE_MEMBERS_PER_HOUSEHOLD: payload.averageMembersPerHousehold,
    LGD_LOCATION_HIERARCHY: mapHierarchyToApi(payload.lgdHierarchy),
    DEPT_LOCATION_HIERARCHY: mapHierarchyToApi(payload.departmentHierarchy),
  }
}

// ---------------------------------------------------------------------------
// Water norms mappers
// ---------------------------------------------------------------------------

export function mapApiConfigToWaterNormsConfiguration(
  configs: TenantConfigMap
): Omit<WaterNormsConfiguration, 'id'> {
  return {
    stateQuantity: configs.WATER_NORM ?? 0,
    // district overrides and regularity are not yet provided by the backend;
    // they remain UI-local until the backend supports these fields
    districtOverrides: [],
    regularity: 0,
    maxQuantity: Number(configs.TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD?.value) || 0,
    minQuantity: 0,
    isConfigured: true,
  }
}

export function mapWaterNormsToApiConfig(
  payload: Omit<WaterNormsConfiguration, 'id'>
): TenantConfigMap {
  // district overrides and regularity are intentionally excluded — not yet supported by backend
  return {
    WATER_NORM: payload.stateQuantity,
    TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD: {
      value: String(payload.maxQuantity),
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

  return {
    primaryLanguage: languageApiNameToValue(languages[0]?.language ?? ''),
    secondaryLanguage: languages[1] ? languageApiNameToValue(languages[1].language) : undefined,
    tertiaryLanguage: languages[2] ? languageApiNameToValue(languages[2].language) : undefined,
    isConfigured: true,
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
  payload: Omit<IntegrationConfiguration, 'id' | 'isConfigured'>
): TenantConfigMap {
  return {
    MESSAGE_BROKER_CONNECTION_SETTINGS: {
      apiUrl: payload.apiUrl as string,
      apiKey: payload.apiKey as string,
      organizationId: payload.organizationId as string,
    },
  }
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
