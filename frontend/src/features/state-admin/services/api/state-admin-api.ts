import { apiClient } from '@/shared/lib/axios'
import {
  deleteMockEscalation,
  getMockActivityData,
  getMockEscalationById,
  getMockEscalations,
  getMockIntegrationConfiguration,
  getMockLanguageConfiguration,
  getMockNudgeTemplates,
  getMockOverviewData,
  getMockStaffSyncData,
  getMockThresholdConfiguration,
  getMockWaterNormsConfiguration,
  saveMockEscalation,
  saveMockIntegrationConfiguration,
  saveMockLanguageConfiguration,
  saveMockThresholdConfiguration,
  saveMockWaterNormsConfiguration,
  updateMockEscalation,
  updateMockNudgeTemplate,
} from '../mock-data'
import type { ActivityLog } from '../../types/activity'
import type { Escalation } from '../../types/escalations'
import type { IntegrationConfiguration } from '../../types/integration'
import type { LanguageConfiguration } from '../../types/language'
import type { NudgeTemplate } from '../../types/nudges'
import type { OverviewData } from '../../types/overview'
import type { StaffSyncData } from '../../types/staff-sync'
import type { ThresholdConfiguration } from '../../types/thresholds'
import type { WaterNormsConfiguration } from '../../types/water-norms'

export type SaveLanguageConfigurationPayload = Omit<LanguageConfiguration, 'id'>
export type SaveIntegrationConfigurationPayload = Omit<
  IntegrationConfiguration,
  'id' | 'isConfigured'
>
export type SaveWaterNormsConfigurationPayload = Omit<WaterNormsConfiguration, 'id'>
export type SaveEscalationPayload = Omit<Escalation, 'id' | 'name'>
export type SaveThresholdConfigurationPayload = Omit<ThresholdConfiguration, 'id'>
export type UpdateNudgeTemplatePayload = { language: string; message: string }

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
  getNudgeTemplates: () => Promise<NudgeTemplate[]>
  updateNudgeTemplate: (id: string, payload: UpdateNudgeTemplatePayload) => Promise<NudgeTemplate>
}

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
    const response = await apiClient.get<LanguageConfiguration>(
      '/api/state-admin/language-configuration'
    )
    return response.data
  },
  saveLanguageConfiguration: async (payload) => {
    const response = await apiClient.put<LanguageConfiguration>(
      '/api/state-admin/language-configuration',
      payload
    )
    return response.data
  },
  getIntegrationConfiguration: async () => {
    const response = await apiClient.get<IntegrationConfiguration>(
      '/api/state-admin/integration-configuration'
    )
    return response.data
  },
  saveIntegrationConfiguration: async (payload) => {
    const response = await apiClient.put<IntegrationConfiguration>(
      '/api/state-admin/integration-configuration',
      payload
    )
    return response.data
  },
  getWaterNormsConfiguration: async () => {
    const response = await apiClient.get<WaterNormsConfiguration>('/api/state-admin/water-norms')
    return response.data
  },
  saveWaterNormsConfiguration: async (payload) => {
    const response = await apiClient.put<WaterNormsConfiguration>(
      '/api/state-admin/water-norms',
      payload
    )
    return response.data
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
  getNudgeTemplates: () => getMockNudgeTemplates(),
  updateNudgeTemplate: (id, payload) => updateMockNudgeTemplate(id, payload),
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
  getNudgeTemplates: () => provider.getNudgeTemplates(),
  updateNudgeTemplate: (id: string, payload: UpdateNudgeTemplatePayload) =>
    provider.updateNudgeTemplate(id, payload),
}
