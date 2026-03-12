import { isAxiosError } from 'axios'
import { useAuthStore } from '@/app/store/auth-store'
import { apiClient } from '@/shared/lib/axios'
import {
  createMockStateUTAdmin,
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
  getMockStateUTAdminById,
  getMockStateUTAdmins,
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
  updateMockStateUTAdmin,
  updateMockStateUTAdminStatus,
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
import type {
  StateUTAdmin,
  CreateStateUTAdminInput,
  UpdateStateUTAdminInput,
} from '../../types/state-ut-admins'
import type { StaffSyncData } from '../../types/staff-sync'
import type { ThresholdConfiguration } from '../../types/thresholds'
import type { WaterNormsConfiguration } from '../../types/water-norms'
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
  'id' | 'isConfigured'
>
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
  getStateUTAdmins: () => Promise<StateUTAdmin[]>
  getStateUTAdminById: (id: string) => Promise<StateUTAdmin | null>
  createStateUTAdmin: (input: CreateStateUTAdminInput) => Promise<StateUTAdmin>
  updateStateUTAdmin: (id: string, input: UpdateStateUTAdminInput) => Promise<StateUTAdmin>
  updateStateUTAdminStatus: (id: string, status: 'active' | 'inactive') => Promise<StateUTAdmin>
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

const CONFIGURATION_KEYS = [
  'TENANT_SUPPORTED_CHANNELS',
  'TENANT_LOGO',
  'METER_CHANGE_REASONS',
  'LOCATION_CHECK_REQUIRED',
  'DATA_CONSOLIDATION_TIME',
  'PUMP_OPERATOR_REMINDER_NUDGE_TIME',
  'AVERAGE_MEMBERS_PER_HOUSEHOLD',
  'LGD_LOCATION_HIERARCHY',
  'DEPT_LOCATION_HIERARCHY',
].join(',')

const WATER_NORMS_KEYS = ['WATER_NORM', 'TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD'].join(',')

const httpProvider: StateAdminDataProvider = {
  getOverviewData: async () => {
    const response = await apiClient.get<OverviewData>('/api/state-admin/overview')
    return response.data
  },
  getActivityData: async () => {
    const response = await apiClient.get<ActivityLog[]>('/api/state-admin/activity')
    return response.data
  },
  getStaffSyncData: async () => {
    const response = await apiClient.get<StaffSyncData>('/api/state-admin/staff-sync')
    return response.data
  },
  getLanguageConfiguration: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<{ configs: Record<string, unknown> }>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=SUPPORTED_LANGUAGES`
    )
    return {
      id: tenantId,
      ...mapApiConfigToLanguageConfiguration(response.data.configs),
    } as LanguageConfiguration
  },
  saveLanguageConfiguration: async (payload) => {
    const tenantId = getTenantId()
    const response = await apiClient.put<{ configs: Record<string, unknown> }>(
      TENANT_CONFIG_BASE(tenantId),
      { configs: mapLanguageConfigToApiConfig(payload) }
    )
    return {
      id: tenantId,
      ...mapApiConfigToLanguageConfiguration(response.data.configs),
    } as LanguageConfiguration
  },
  getIntegrationConfiguration: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<{ configs: Record<string, unknown> }>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=MESSAGE_BROKER_CONNECTION_SETTINGS`
    )
    return {
      id: tenantId,
      ...mapApiConfigToIntegrationConfiguration(response.data.configs),
    } as IntegrationConfiguration
  },
  saveIntegrationConfiguration: async (payload) => {
    const tenantId = getTenantId()
    const response = await apiClient.put<{ configs: Record<string, unknown> }>(
      TENANT_CONFIG_BASE(tenantId),
      { configs: mapIntegrationConfigToApiConfig(payload) }
    )
    return {
      id: tenantId,
      ...mapApiConfigToIntegrationConfiguration(response.data.configs),
    } as IntegrationConfiguration
  },
  getWaterNormsConfiguration: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<{ configs: Record<string, unknown> }>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=${WATER_NORMS_KEYS}`
    )
    return {
      id: tenantId,
      ...mapApiConfigToWaterNormsConfiguration(response.data.configs),
    } as WaterNormsConfiguration
  },
  saveWaterNormsConfiguration: async (payload) => {
    const tenantId = getTenantId()
    const response = await apiClient.put<{ configs: Record<string, unknown> }>(
      TENANT_CONFIG_BASE(tenantId),
      { configs: mapWaterNormsToApiConfig(payload) }
    )
    return {
      id: tenantId,
      ...mapApiConfigToWaterNormsConfiguration(response.data.configs),
    } as WaterNormsConfiguration
  },
  getEscalations: async () => {
    const response = await apiClient.get<Escalation[]>('/api/state-admin/escalations')
    return response.data
  },
  getEscalationById: async (id) => {
    const response = await apiClient.get<Escalation>(`/api/state-admin/escalations/${id}`)
    return response.data
  },
  createEscalation: async (payload) => {
    const response = await apiClient.post<Escalation>('/api/state-admin/escalations', payload)
    return response.data
  },
  updateEscalation: async (id, payload) => {
    const response = await apiClient.put<Escalation>(`/api/state-admin/escalations/${id}`, payload)
    return response.data
  },
  deleteEscalation: async (id) => {
    await apiClient.delete(`/api/state-admin/escalations/${id}`)
  },
  getThresholdConfiguration: async () => {
    const response = await apiClient.get<ThresholdConfiguration>(
      '/api/state-admin/threshold-configuration'
    )
    return response.data
  },
  saveThresholdConfiguration: async (payload) => {
    const response = await apiClient.put<ThresholdConfiguration>(
      '/api/state-admin/threshold-configuration',
      payload
    )
    return response.data
  },
  getMessageTemplates: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<{ configs: Record<string, unknown> }>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=GLIFIC_MESSAGE_TEMPLATES,SUPPORTED_LANGUAGES`
    )
    return mapApiConfigToMessageTemplates(
      response.data.configs as Parameters<typeof mapApiConfigToMessageTemplates>[0]
    )
  },
  getNudgeTemplates: async () => {
    const response = await apiClient.get<NudgeTemplate[]>('/api/state-admin/nudge-templates')
    return response.data
  },
  updateNudgeTemplate: async (id, payload) => {
    const response = await apiClient.put<NudgeTemplate>(
      `/api/state-admin/nudge-templates/${id}`,
      payload
    )
    return response.data
  },
  getConfiguration: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<{ configs: Record<string, unknown> }>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=${CONFIGURATION_KEYS}`
    )
    return {
      id: tenantId,
      ...mapApiConfigToConfigurationData(response.data.configs),
    } as ConfigurationData
  },
  saveConfiguration: async (payload) => {
    const tenantId = getTenantId()
    const response = await apiClient.put<{ configs: Record<string, unknown> }>(
      TENANT_CONFIG_BASE(tenantId),
      { configs: mapConfigurationDataToApiConfig(payload) }
    )
    return {
      id: tenantId,
      ...mapApiConfigToConfigurationData(response.data.configs),
    } as ConfigurationData
  },
  getStateUTAdmins: async () => {
    const response = await apiClient.get<StateUTAdmin[]>('/api/state-admin/admins')
    return response.data
  },
  getStateUTAdminById: async (id) => {
    try {
      const response = await apiClient.get<StateUTAdmin>(`/api/state-admin/admins/${id}`)
      return response.data
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },
  createStateUTAdmin: async (input) => {
    const response = await apiClient.post<StateUTAdmin>('/api/state-admin/admins', input)
    return response.data
  },
  updateStateUTAdmin: async (id, input) => {
    const response = await apiClient.patch<StateUTAdmin>(`/api/state-admin/admins/${id}`, input)
    return response.data
  },
  updateStateUTAdminStatus: async (id, status) => {
    const response = await apiClient.patch<StateUTAdmin>(`/api/state-admin/admins/${id}/status`, {
      status,
    })
    return response.data
  },
  getEscalationRules: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<{ configs: Record<string, unknown> }>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=FIELD_STAFF_ESCALATION_RULES`
    )
    return mapApiConfigToEscalationRules(response.data.configs)
  },
  saveEscalationRules: async (payload) => {
    const tenantId = getTenantId()
    const response = await apiClient.put<{ configs: Record<string, unknown> }>(
      TENANT_CONFIG_BASE(tenantId),
      { configs: mapEscalationRulesToApiConfig(payload) }
    )
    return mapApiConfigToEscalationRules(response.data.configs)
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
  getStateUTAdmins: () => getMockStateUTAdmins(),
  getStateUTAdminById: (id) => getMockStateUTAdminById(id),
  createStateUTAdmin: (input) => createMockStateUTAdmin(input),
  updateStateUTAdmin: (id, input) => updateMockStateUTAdmin(id, input),
  updateStateUTAdminStatus: (id, status) => updateMockStateUTAdminStatus(id, status),
  getEscalationRules: () => getMockEscalationRules(),
  saveEscalationRules: (payload) => saveMockEscalationRules(payload),
}

const STATE_ADMIN_PROVIDER = import.meta.env.VITE_STATE_ADMIN_DATA_PROVIDER ?? 'mock'
const provider: StateAdminDataProvider =
  STATE_ADMIN_PROVIDER === 'http' ? httpProvider : mockProvider

export const stateAdminApi = {
  getOverviewData: () => provider.getOverviewData(),
  getActivityData: () => provider.getActivityData(),
  getStaffSyncData: () => provider.getStaffSyncData(),
  getLanguageConfiguration: () => provider.getLanguageConfiguration(),
  saveLanguageConfiguration: (payload: SaveLanguageConfigurationPayload) =>
    provider.saveLanguageConfiguration(payload),
  getIntegrationConfiguration: () => provider.getIntegrationConfiguration(),
  saveIntegrationConfiguration: (payload: SaveIntegrationConfigurationPayload) =>
    provider.saveIntegrationConfiguration(payload),
  getWaterNormsConfiguration: () => provider.getWaterNormsConfiguration(),
  saveWaterNormsConfiguration: (payload: SaveWaterNormsConfigurationPayload) =>
    provider.saveWaterNormsConfiguration(payload),
  getEscalations: () => provider.getEscalations(),
  getEscalationById: (id: string) => provider.getEscalationById(id),
  createEscalation: (payload: SaveEscalationPayload) => provider.createEscalation(payload),
  updateEscalation: (id: string, payload: SaveEscalationPayload) =>
    provider.updateEscalation(id, payload),
  deleteEscalation: (id: string) => provider.deleteEscalation(id),
  getThresholdConfiguration: () => provider.getThresholdConfiguration(),
  saveThresholdConfiguration: (payload: SaveThresholdConfigurationPayload) =>
    provider.saveThresholdConfiguration(payload),
  getMessageTemplates: () => provider.getMessageTemplates(),
  getNudgeTemplates: () => provider.getNudgeTemplates(),
  updateNudgeTemplate: (id: string, payload: UpdateNudgeTemplatePayload) =>
    provider.updateNudgeTemplate(id, payload),
  getConfiguration: () => provider.getConfiguration(),
  saveConfiguration: (payload: SaveConfigurationPayload) => provider.saveConfiguration(payload),
  getStateUTAdmins: () => provider.getStateUTAdmins(),
  getStateUTAdminById: (id: string) => provider.getStateUTAdminById(id),
  createStateUTAdmin: (input: CreateStateUTAdminInput) => provider.createStateUTAdmin(input),
  updateStateUTAdmin: (id: string, input: UpdateStateUTAdminInput) =>
    provider.updateStateUTAdmin(id, input),
  updateStateUTAdminStatus: (id: string, status: 'active' | 'inactive') =>
    provider.updateStateUTAdminStatus(id, status),
  getEscalationRules: () => provider.getEscalationRules(),
  saveEscalationRules: (payload: SaveEscalationRulesPayload) =>
    provider.saveEscalationRules(payload),
}
