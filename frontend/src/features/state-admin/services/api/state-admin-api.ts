import { isAxiosError } from 'axios'
import { useAuthStore } from '@/app/store/auth-store'
import { apiClient } from '@/shared/lib/axios'
import {
  deleteMockEscalation,
  getMockActivityData,
  getMockConfigurationData,
  getMockEscalationById,
  getMockEscalations,
  getMockEscalationRules,
  getMockIntegrationConfiguration,
  getMockLanguageConfiguration,
  getMockMessageTemplates,
  getMockNudgeTemplates,
  getMockOverviewData,
  getMockStaffSyncData,
  getMockThresholdConfiguration,
  getMockWaterNormsConfiguration,
  saveMockConfigurationData,
  saveMockEscalation,
  saveMockEscalationRules,
  saveMockIntegrationConfiguration,
  saveMockLanguageConfiguration,
  saveMockThresholdConfiguration,
  saveMockWaterNormsConfiguration,
  updateMockEscalation,
  updateMockNudgeTemplate,
} from '../mock-data'
import type { ActivityLog } from '../../types/activity'
import type { ConfigurationData } from '../../types/configuration'
import type { Escalation } from '../../types/escalations'
import type {
  EscalationRulesConfig,
  SaveEscalationRulesPayload,
} from '../../types/escalation-rules'
import type { IntegrationConfiguration } from '../../types/integration'
import type { LanguageConfiguration } from '../../types/language'
import type { MessageTemplatesData } from '../../types/message-templates'
import type { NudgeTemplate } from '../../types/nudges'
import type { OverviewData } from '../../types/overview'
import type { StateUTAdmin, UpdateStateUTAdminInput } from '../../types/state-ut-admins'
import type { StaffSyncData } from '../../types/staff-sync'
import type { ThresholdConfiguration } from '../../types/thresholds'
import type { WaterNormsConfiguration } from '../../types/water-norms'
import type {
  HierarchyData,
  HierarchyEditConstraints,
  HierarchyLevel,
  ApiHierarchyResponse,
} from '../../types/hierarchy'
import type { ConfigStatusMap } from '../../types/config-status'
import {
  mapApiHierarchyToLevels,
  mapLevelsToApiPayload,
  DEFAULT_LGD_HIERARCHY,
  DEFAULT_DEPARTMENT_HIERARCHY,
} from '../../types/hierarchy'
import {
  mapApiConfigToConfigurationData,
  mapApiConfigToEscalationRules,
  mapApiConfigToIntegrationConfiguration,
  mapApiConfigToLanguageConfiguration,
  mapApiConfigToMessageTemplates,
  mapApiConfigToWaterNormsConfiguration,
  mapConfigurationDataToApiConfig,
  mapEscalationRulesToApiConfig,
  mapIntegrationConfigToApiConfig,
  mapLanguageConfigToApiConfig,
  mapWaterNormsToApiConfig,
} from './tenant-config-mappers'

export type SaveLanguageConfigurationPayload = Omit<LanguageConfiguration, 'id'>
export type SaveIntegrationConfigurationPayload = Omit<
  IntegrationConfiguration,
  'id' | 'isConfigured' | 'apiKey'
> & { apiKey?: string }
export type SaveWaterNormsConfigurationPayload = Omit<WaterNormsConfiguration, 'id'>
export type SaveEscalationPayload = Omit<Escalation, 'id' | 'name'>
export type SaveThresholdConfigurationPayload = Omit<ThresholdConfiguration, 'id'>
export type UpdateNudgeTemplatePayload = { language: string; message: string }
export type SaveConfigurationPayload = Omit<ConfigurationData, 'id'>

type StateAdminDataProvider = {
  getOverviewData: () => Promise<OverviewData>
  getActivityData: () => Promise<ActivityLog[]>
  getStaffSyncData: () => Promise<StaffSyncData>
  getLanguageConfiguration: () => Promise<LanguageConfiguration>
  saveLanguageConfiguration: (
    payload: SaveLanguageConfigurationPayload
  ) => Promise<LanguageConfiguration>
  getIntegrationConfiguration: () => Promise<IntegrationConfiguration>
  saveIntegrationConfiguration: (
    payload: SaveIntegrationConfigurationPayload
  ) => Promise<IntegrationConfiguration>
  getWaterNormsConfiguration: () => Promise<WaterNormsConfiguration>
  saveWaterNormsConfiguration: (
    payload: SaveWaterNormsConfigurationPayload
  ) => Promise<WaterNormsConfiguration>
  getEscalations: () => Promise<Escalation[]>
  getEscalationById: (id: string) => Promise<Escalation | null>
  createEscalation: (payload: SaveEscalationPayload) => Promise<Escalation>
  updateEscalation: (id: string, payload: SaveEscalationPayload) => Promise<Escalation>
  deleteEscalation: (id: string) => Promise<void>
  getThresholdConfiguration: () => Promise<ThresholdConfiguration>
  saveThresholdConfiguration: (
    payload: SaveThresholdConfigurationPayload
  ) => Promise<ThresholdConfiguration>
  getMessageTemplates: () => Promise<MessageTemplatesData>
  getNudgeTemplates: () => Promise<NudgeTemplate[]>
  updateNudgeTemplate: (id: string, payload: UpdateNudgeTemplatePayload) => Promise<NudgeTemplate>
  getConfiguration: () => Promise<ConfigurationData>
  saveConfiguration: (payload: SaveConfigurationPayload) => Promise<ConfigurationData>
  getEscalationRules: () => Promise<EscalationRulesConfig>
  saveEscalationRules: (payload: SaveEscalationRulesPayload) => Promise<EscalationRulesConfig>
}

/** Reads tenantId from the auth store. Throws if the user is not authenticated. */
const getTenantId = (): string => {
  const id = useAuthStore.getState().user?.tenantId
  if (!id) throw new Error('tenantId unavailable — user not authenticated')
  return id
}

const TENANT_CONFIG_BASE = (tenantId: string) => `/api/v1/tenants/${tenantId}/config`

/** Minimal user shape from GET /api/v1/users — local to this file */
interface ApiUser {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string
  active: boolean
}

interface ApiUsersListResponse {
  content: ApiUser[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

function mapApiUserToAdmin(u: ApiUser): StateUTAdmin {
  return {
    id: String(u.id),
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    email: u.email,
    phone: u.phoneNumber,
    status: u.active ? 'active' : 'inactive',
  }
}

const CONFIGURATION_KEYS = [
  'TENANT_SUPPORTED_CHANNELS',
  'TENANT_LOGO',
  'METER_CHANGE_REASONS',
  'LOCATION_CHECK_REQUIRED',
  'DATA_CONSOLIDATION_TIME',
  'PUMP_OPERATOR_REMINDER_NUDGE_TIME',
  'AVERAGE_MEMBERS_PER_HOUSEHOLD',
].join(',')

const WATER_NORMS_KEYS = ['WATER_NORM', 'TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD'].join(',')

// The backend wraps all responses in { status, message, data: T }.
// Axios parses the HTTP body into response.data, so the actual payload is at response.data.data.
type ApiEnvelope<T> = { data: T }

const httpProvider: StateAdminDataProvider = {
  getOverviewData: async () => {
    const response = await apiClient.get<ApiEnvelope<OverviewData>>('/api/state-admin/overview')
    return response.data.data
  },
  getActivityData: async () => {
    const response = await apiClient.get<ApiEnvelope<ActivityLog[]>>('/api/state-admin/activity')
    return response.data.data
  },
  getStaffSyncData: async () => {
    const response = await apiClient.get<ApiEnvelope<StaffSyncData>>('/api/state-admin/staff-sync')
    return response.data.data
  },
  getLanguageConfiguration: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=SUPPORTED_LANGUAGES`
    )
    return {
      id: tenantId,
      ...mapApiConfigToLanguageConfiguration(response.data.data.configs),
    } as LanguageConfiguration
  },
  saveLanguageConfiguration: async (payload) => {
    const tenantId = getTenantId()
    const response = await apiClient.put<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      TENANT_CONFIG_BASE(tenantId),
      { configs: mapLanguageConfigToApiConfig(payload) }
    )
    return {
      id: tenantId,
      ...mapApiConfigToLanguageConfiguration(response.data.data.configs),
    } as LanguageConfiguration
  },
  getIntegrationConfiguration: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=MESSAGE_BROKER_CONNECTION_SETTINGS`
    )
    return {
      id: tenantId,
      ...mapApiConfigToIntegrationConfiguration(response.data.data.configs),
    } as IntegrationConfiguration
  },
  saveIntegrationConfiguration: async (payload) => {
    const tenantId = getTenantId()
    const response = await apiClient.put<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      TENANT_CONFIG_BASE(tenantId),
      { configs: mapIntegrationConfigToApiConfig(payload) }
    )
    return {
      id: tenantId,
      ...mapApiConfigToIntegrationConfiguration(response.data.data.configs),
    } as IntegrationConfiguration
  },
  getWaterNormsConfiguration: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=${WATER_NORMS_KEYS}`
    )
    return {
      id: tenantId,
      ...mapApiConfigToWaterNormsConfiguration(response.data.data.configs),
    } as WaterNormsConfiguration
  },
  saveWaterNormsConfiguration: async (payload) => {
    const tenantId = getTenantId()
    const response = await apiClient.put<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      TENANT_CONFIG_BASE(tenantId),
      { configs: mapWaterNormsToApiConfig(payload) }
    )
    return {
      id: tenantId,
      ...mapApiConfigToWaterNormsConfiguration(response.data.data.configs),
    } as WaterNormsConfiguration
  },
  getEscalations: async () => {
    const response = await apiClient.get<ApiEnvelope<Escalation[]>>('/api/state-admin/escalations')
    return response.data.data
  },
  getEscalationById: async (id) => {
    const response = await apiClient.get<ApiEnvelope<Escalation>>(
      `/api/state-admin/escalations/${id}`
    )
    return response.data.data
  },
  createEscalation: async (payload) => {
    const response = await apiClient.post<ApiEnvelope<Escalation>>(
      '/api/state-admin/escalations',
      payload
    )
    return response.data.data
  },
  updateEscalation: async (id, payload) => {
    const response = await apiClient.put<ApiEnvelope<Escalation>>(
      `/api/state-admin/escalations/${id}`,
      payload
    )
    return response.data.data
  },
  deleteEscalation: async (id) => {
    await apiClient.delete(`/api/state-admin/escalations/${id}`)
  },
  getThresholdConfiguration: async () => {
    const response = await apiClient.get<ApiEnvelope<ThresholdConfiguration>>(
      '/api/state-admin/threshold-configuration'
    )
    return response.data.data
  },
  saveThresholdConfiguration: async (payload) => {
    const response = await apiClient.put<ApiEnvelope<ThresholdConfiguration>>(
      '/api/state-admin/threshold-configuration',
      payload
    )
    return response.data.data
  },
  getMessageTemplates: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=GLIFIC_MESSAGE_TEMPLATES,SUPPORTED_LANGUAGES`
    )
    return mapApiConfigToMessageTemplates(
      response.data.data.configs as Parameters<typeof mapApiConfigToMessageTemplates>[0]
    )
  },
  getNudgeTemplates: async () => {
    const response = await apiClient.get<ApiEnvelope<NudgeTemplate[]>>(
      '/api/state-admin/nudge-templates'
    )
    return response.data.data
  },
  updateNudgeTemplate: async (id, payload) => {
    const response = await apiClient.put<ApiEnvelope<NudgeTemplate>>(
      `/api/state-admin/nudge-templates/${id}`,
      payload
    )
    return response.data.data
  },
  getConfiguration: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=${CONFIGURATION_KEYS}`
    )
    return {
      id: tenantId,
      ...mapApiConfigToConfigurationData(response.data.data.configs),
    } as ConfigurationData
  },
  saveConfiguration: async (payload) => {
    const tenantId = getTenantId()
    const response = await apiClient.put<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      TENANT_CONFIG_BASE(tenantId),
      { configs: mapConfigurationDataToApiConfig(payload) }
    )
    return {
      id: tenantId,
      ...mapApiConfigToConfigurationData(response.data.data.configs),
    } as ConfigurationData
  },
  getEscalationRules: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=FIELD_STAFF_ESCALATION_RULES`
    )
    return mapApiConfigToEscalationRules(response.data.data.configs)
  },
  saveEscalationRules: async (payload) => {
    const tenantId = getTenantId()
    const response = await apiClient.put<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      TENANT_CONFIG_BASE(tenantId),
      { configs: mapEscalationRulesToApiConfig(payload) }
    )
    return mapApiConfigToEscalationRules(response.data.data.configs)
  },
}

const mockProvider: StateAdminDataProvider = {
  getOverviewData: () => getMockOverviewData(),
  getActivityData: () => getMockActivityData(),
  getStaffSyncData: () => getMockStaffSyncData(),
  getLanguageConfiguration: () => getMockLanguageConfiguration(),
  saveLanguageConfiguration: (payload) => saveMockLanguageConfiguration(payload),
  getIntegrationConfiguration: () => getMockIntegrationConfiguration(),
  saveIntegrationConfiguration: (payload) => saveMockIntegrationConfiguration(payload),
  getWaterNormsConfiguration: () => getMockWaterNormsConfiguration(),
  saveWaterNormsConfiguration: (payload) => saveMockWaterNormsConfiguration(payload),
  getEscalations: () => getMockEscalations(),
  getEscalationById: (id) => getMockEscalationById(id),
  createEscalation: (payload) => saveMockEscalation(payload),
  updateEscalation: (id, payload) => updateMockEscalation(id, payload),
  deleteEscalation: (id) => deleteMockEscalation(id),
  getThresholdConfiguration: () => getMockThresholdConfiguration(),
  saveThresholdConfiguration: (payload) => saveMockThresholdConfiguration(payload),
  getMessageTemplates: () => getMockMessageTemplates(),
  getNudgeTemplates: () => getMockNudgeTemplates(),
  updateNudgeTemplate: (id, payload) => updateMockNudgeTemplate(id, payload),
  getConfiguration: () => getMockConfigurationData(),
  saveConfiguration: (payload) => saveMockConfigurationData(payload),
  getEscalationRules: () => getMockEscalationRules(),
  saveEscalationRules: (payload) => saveMockEscalationRules(payload),
}

// Real HTTP: language, integration, water norms, system config, thresholds,
//            escalations, escalation rules, Glific message templates, state-ut-admins
// Mock:      overview, activity, staff sync, nudge templates
export const stateAdminApi = {
  // --- Mock ---
  getOverviewData: () => mockProvider.getOverviewData(),
  getActivityData: () => mockProvider.getActivityData(),
  getStaffSyncData: () => mockProvider.getStaffSyncData(),
  getNudgeTemplates: () => mockProvider.getNudgeTemplates(),
  updateNudgeTemplate: (id: string, payload: UpdateNudgeTemplatePayload) =>
    mockProvider.updateNudgeTemplate(id, payload),

  // --- Real HTTP: State/UT Admins ---
  getStateUTAdmins: async (tenantCode: string): Promise<StateUTAdmin[]> => {
    const response = await apiClient.get<ApiEnvelope<ApiUsersListResponse>>(
      '/api/v1/users/state-admins',
      { params: { tenantCode } }
    )
    return response.data.data.content.map((u) => mapApiUserToAdmin(u))
  },
  getStateUTAdminById: async (id: string): Promise<StateUTAdmin | null> => {
    try {
      const response = await apiClient.get<ApiEnvelope<ApiUser>>(`/api/v1/users/${id}`)
      return mapApiUserToAdmin(response.data.data)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null
      throw error
    }
  },
  updateStateUTAdmin: async (id: string, input: UpdateStateUTAdminInput): Promise<void> => {
    await apiClient.patch(`/api/v1/users/${id}`, {
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phone,
    })
  },
  updateStateUTAdminStatus: async (id: string, status: 'active' | 'inactive'): Promise<void> => {
    if (status === 'inactive') {
      await apiClient.put(`/api/v1/users/${id}/deactivate`)
    } else {
      await apiClient.put(`/api/v1/users/${id}/activate`)
    }
  },
  inviteStateUTAdmin: async (email: string, tenantCode: string): Promise<void> => {
    await apiClient.post('/api/v1/users/invite', {
      email,
      role: 'STATE_ADMIN',
      tenantCode,
    })
  },

  // --- Real HTTP ---
  getLanguageConfiguration: () => httpProvider.getLanguageConfiguration(),
  saveLanguageConfiguration: (payload: SaveLanguageConfigurationPayload) =>
    httpProvider.saveLanguageConfiguration(payload),
  getIntegrationConfiguration: () => httpProvider.getIntegrationConfiguration(),
  saveIntegrationConfiguration: (payload: SaveIntegrationConfigurationPayload) =>
    httpProvider.saveIntegrationConfiguration(payload),
  getWaterNormsConfiguration: () => httpProvider.getWaterNormsConfiguration(),
  saveWaterNormsConfiguration: (payload: SaveWaterNormsConfigurationPayload) =>
    httpProvider.saveWaterNormsConfiguration(payload),
  getEscalations: () => httpProvider.getEscalations(),
  getEscalationById: (id: string) => httpProvider.getEscalationById(id),
  createEscalation: (payload: SaveEscalationPayload) => httpProvider.createEscalation(payload),
  updateEscalation: (id: string, payload: SaveEscalationPayload) =>
    httpProvider.updateEscalation(id, payload),
  deleteEscalation: (id: string) => httpProvider.deleteEscalation(id),
  getThresholdConfiguration: () => httpProvider.getThresholdConfiguration(),
  saveThresholdConfiguration: (payload: SaveThresholdConfigurationPayload) =>
    httpProvider.saveThresholdConfiguration(payload),
  getMessageTemplates: () => httpProvider.getMessageTemplates(),
  getConfiguration: () => httpProvider.getConfiguration(),
  saveConfiguration: (payload: SaveConfigurationPayload) => httpProvider.saveConfiguration(payload),
  getEscalationRules: () => httpProvider.getEscalationRules(),
  saveEscalationRules: (payload: SaveEscalationRulesPayload) =>
    httpProvider.saveEscalationRules(payload),

  // --- Real HTTP: Hierarchy ---
  getLgdHierarchy: async (): Promise<HierarchyData> => {
    const tenantId = getTenantId()
    const response = await apiClient.get<ApiEnvelope<ApiHierarchyResponse>>(
      `/api/v1/tenants/${tenantId}/location-hierarchy/LGD`
    )
    return {
      hierarchyType: 'LGD',
      levels: mapApiHierarchyToLevels(response.data.data.levels, DEFAULT_LGD_HIERARCHY),
    }
  },

  getDepartmentHierarchy: async (): Promise<HierarchyData> => {
    const tenantId = getTenantId()
    const response = await apiClient.get<ApiEnvelope<ApiHierarchyResponse>>(
      `/api/v1/tenants/${tenantId}/location-hierarchy/DEPARTMENT`
    )
    return {
      hierarchyType: 'DEPARTMENT',
      levels: mapApiHierarchyToLevels(response.data.data.levels, DEFAULT_DEPARTMENT_HIERARCHY),
    }
  },

  getLgdEditConstraints: async (): Promise<HierarchyEditConstraints> => {
    const tenantId = getTenantId()
    const response = await apiClient.get<ApiEnvelope<HierarchyEditConstraints>>(
      `/api/v1/tenants/${tenantId}/location-hierarchy/LGD/edit-constraints`
    )
    return response.data.data
  },

  getDepartmentEditConstraints: async (): Promise<HierarchyEditConstraints> => {
    const tenantId = getTenantId()
    const response = await apiClient.get<ApiEnvelope<HierarchyEditConstraints>>(
      `/api/v1/tenants/${tenantId}/location-hierarchy/DEPARTMENT/edit-constraints`
    )
    return response.data.data
  },

  saveLgdHierarchy: async (levels: HierarchyLevel[]): Promise<HierarchyData> => {
    const tenantId = getTenantId()
    const response = await apiClient.put<ApiEnvelope<ApiHierarchyResponse>>(
      `/api/v1/tenants/${tenantId}/location-hierarchy/LGD`,
      mapLevelsToApiPayload(levels)
    )
    return {
      hierarchyType: 'LGD',
      levels: mapApiHierarchyToLevels(response.data.data.levels, DEFAULT_LGD_HIERARCHY),
    }
  },

  saveDepartmentHierarchy: async (levels: HierarchyLevel[]): Promise<HierarchyData> => {
    const tenantId = getTenantId()
    const response = await apiClient.put<ApiEnvelope<ApiHierarchyResponse>>(
      `/api/v1/tenants/${tenantId}/location-hierarchy/DEPARTMENT`,
      mapLevelsToApiPayload(levels)
    )
    return {
      hierarchyType: 'DEPARTMENT',
      levels: mapApiHierarchyToLevels(response.data.data.levels, DEFAULT_DEPARTMENT_HIERARCHY),
    }
  },

  // --- Real HTTP: Config Status ---
  getConfigStatus: async (): Promise<ConfigStatusMap> => {
    const tenantId = getTenantId()
    const response = await apiClient.get<
      ApiEnvelope<{ configs: Record<string, { status: string }> }>
    >(`/api/v1/tenants/${tenantId}/config/status`)
    const configs = response.data.data.configs
    const result: ConfigStatusMap = {}
    for (const [key, val] of Object.entries(configs)) {
      result[key] = val.status as ConfigStatusMap[string]
    }
    return result
  },
}
