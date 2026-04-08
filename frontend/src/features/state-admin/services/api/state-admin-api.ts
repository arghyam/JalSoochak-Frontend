import { isAxiosError } from 'axios'
import { useAuthStore } from '@/app/store/auth-store'
import { apiClient } from '@/shared/lib/axios'
import type { ConfigurationData } from '../../types/configuration'
import type { SaveEscalationRulesPayload } from '../../types/escalation-rules'
import type { IntegrationConfiguration } from '../../types/integration'
import type { LanguageConfiguration } from '../../types/language'
import type { StaffCountsData } from '../../types/overview'
import type { StateUTAdmin, UpdateStateUTAdminInput } from '../../types/state-ut-admins'
import type { StaffListParams, StaffListResponse } from '../../types/staff-sync'
import type { SchemeCounts, SchemeListParams, SchemeListResponse } from '../../types/scheme-sync'
import type {
  SchemeMappingListParams,
  SchemeMappingListResponse,
} from '../../types/scheme-mappings-sync'
import type { WaterNormsConfiguration } from '../../types/water-norms'
import type {
  HierarchyData,
  HierarchyEditConstraints,
  HierarchyLevel,
  ApiHierarchyResponse,
} from '../../types/hierarchy'
import type { ConfigKey, ConfigKeyStatus, ConfigStatusMap } from '../../types/config-status'
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
export type SaveConfigurationPayload = Omit<ConfigurationData, 'id'>

export interface BroadcastWelcomePayload {
  roles: string[]
  type: string
  onboardedAfter: string
  onboardedBefore: string
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
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
}

interface ApiUsersListResponse {
  content: ApiUser[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

function mapApiUserToAdmin(u: ApiUser): StateUTAdmin {
  let status: StateUTAdmin['status']
  if (u.status === 'ACTIVE') {
    status = 'active'
  } else if (u.status === 'PENDING') {
    status = 'pending'
  } else {
    status = 'inactive'
  }
  return {
    id: String(u.id),
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    email: u.email,
    phone: u.phoneNumber,
    status,
  }
}

const CONFIGURATION_KEYS = [
  'TENANT_SUPPORTED_CHANNELS',
  'METER_CHANGE_REASONS',
  'SUPPLY_OUTAGE_REASONS',
  'LOCATION_CHECK_REQUIRED',
  'DISPLAY_DEPARTMENT_MAPS',
  'DATA_CONSOLIDATION_TIME',
  'PUMP_OPERATOR_REMINDER_NUDGE_TIME',
  'DATE_FORMAT_SCREEN',
  'DATE_FORMAT_TABLE',
  'AVERAGE_MEMBERS_PER_HOUSEHOLD',
].join(',')

const WATER_NORMS_KEYS = ['WATER_NORM', 'TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD'].join(',')

// The backend wraps all responses in { status, message, data: T }.
// Axios parses the HTTP body into response.data, so the actual payload is at response.data.data.
type ApiEnvelope<T> = { data: T }

const httpProvider = {
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
  saveLanguageConfiguration: async (payload: SaveLanguageConfigurationPayload) => {
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
  saveIntegrationConfiguration: async (payload: SaveIntegrationConfigurationPayload) => {
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
  saveWaterNormsConfiguration: async (payload: SaveWaterNormsConfigurationPayload) => {
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
  getMessageTemplates: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=GLIFIC_MESSAGE_TEMPLATES,SUPPORTED_LANGUAGES`
    )
    return mapApiConfigToMessageTemplates(
      response.data.data.configs as Parameters<typeof mapApiConfigToMessageTemplates>[0]
    )
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
  saveConfiguration: async (payload: SaveConfigurationPayload) => {
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
  getSystemChannels: async (): Promise<string[]> => {
    const response = await apiClient.get<ApiEnvelope<string[]>>('/api/v1/system/channels')
    return response.data.data
  },
  getLogo: async () => {
    const tenantId = getTenantId()
    try {
      const response = await apiClient.get(`/api/v1/tenants/${tenantId}/logo`, {
        responseType: 'blob',
      })
      return response.data as Blob
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null
      throw error
    }
  },
  updateLogo: async (file: File) => {
    const tenantId = getTenantId()
    const formData = new FormData()
    formData.append('file', file)
    await apiClient.put(`/api/v1/tenants/${tenantId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getEscalationRules: async () => {
    const tenantId = getTenantId()
    const response = await apiClient.get<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      `${TENANT_CONFIG_BASE(tenantId)}?keys=FIELD_STAFF_ESCALATION_RULES`
    )
    return mapApiConfigToEscalationRules(response.data.data.configs)
  },
  saveEscalationRules: async (payload: SaveEscalationRulesPayload) => {
    const tenantId = getTenantId()
    const response = await apiClient.put<ApiEnvelope<{ configs: Record<string, unknown> }>>(
      TENANT_CONFIG_BASE(tenantId),
      { configs: mapEscalationRulesToApiConfig(payload) }
    )
    return mapApiConfigToEscalationRules(response.data.data.configs)
  },
}

export const stateAdminApi = {
  // --- Real HTTP: Staff Counts ---
  getStaffCounts: async (): Promise<StaffCountsData> => {
    const tenantCode = useAuthStore.getState().user?.tenantCode
    if (!tenantCode) throw new Error('tenantCode unavailable — user not authenticated')
    type RoleCount = { role: string; count: number }
    const response = await apiClient.get<ApiEnvelope<RoleCount[]>>(
      '/api/v1/tenant/user/staff/counts/by-role',
      { params: { tenantCode } }
    )
    const counts = response.data.data
    const get = (role: string) => counts.find((r) => r.role === role)?.count ?? 0
    const pumpOperators = get('PUMP_OPERATOR')
    const sectionOfficers = get('SECTION_OFFICER')
    const subDivisionOfficers = get('SUB_DIVISIONAL_OFFICER')
    return {
      totalStaff: pumpOperators + sectionOfficers + subDivisionOfficers,
      pumpOperators,
      sectionOfficers,
      subDivisionOfficers,
      totalAdmins: get('STATE_ADMIN'),
    }
  },

  // --- Real HTTP: Staff List ---
  getStaffList: async (params: StaffListParams): Promise<StaffListResponse> => {
    type ApiStaffResponse = {
      content: StaffListResponse['items']
      totalElements: number
    }
    const response = await apiClient.get<ApiEnvelope<ApiStaffResponse>>(
      '/api/v1/tenant/user/staff',
      {
        params: {
          role: params.roles.join(','),
          ...(params.status ? { status: params.status } : {}),
          ...(params.name ? { name: params.name } : {}),
          page: params.page,
          limit: params.limit,
          tenantCode: params.tenantCode,
        },
      }
    )
    return {
      items: response.data.data.content,
      totalElements: response.data.data.totalElements,
    }
  },

  // --- Real HTTP: Upload Staff ---
  uploadPumpOperators: async (file: File, tenantCode: string): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    await apiClient.post('/api/v1/state-admin/pump-operators/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Tenant-Code': tenantCode,
      },
    })
  },

  // --- Real HTTP: Scheme Counts ---
  getSchemeCounts: async (tenantCode: string): Promise<SchemeCounts> => {
    const response = await apiClient.get<SchemeCounts>('/api/v1/scheme/schemes/counts/by-status', {
      params: { tenantCode },
    })
    return response.data
  },

  // --- Real HTTP: Scheme List ---
  getSchemeList: async (params: SchemeListParams): Promise<SchemeListResponse> => {
    type ApiSchemeListResponse = {
      content: SchemeListResponse['items']
      totalElements: number
    }
    const response = await apiClient.get<ApiSchemeListResponse>('/api/v1/scheme/schemes', {
      params: {
        tenantCode: params.tenantCode,
        page: params.page,
        limit: params.limit,
        ...(params.workStatus ? { workStatus: params.workStatus } : {}),
        ...(params.operatingStatus ? { operatingStatus: params.operatingStatus } : {}),
        ...(params.schemeName ? { schemeName: params.schemeName } : {}),
        ...(params.sortDir ? { sortDir: params.sortDir } : {}),
      },
    })
    return {
      items: response.data.content,
      totalElements: response.data.totalElements,
    }
  },

  // --- Real HTTP: Upload Schemes ---
  uploadSchemes: async (file: File, tenantCode: string): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    await apiClient.post('/api/v1/scheme/schemes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Tenant-Code': tenantCode,
      },
    })
  },

  // --- Real HTTP: Scheme Mappings List ---
  getSchemeMappingsList: async (
    params: SchemeMappingListParams
  ): Promise<SchemeMappingListResponse> => {
    type ApiSchemeMappingsResponse = {
      content: SchemeMappingListResponse['items']
      totalElements: number
    }
    const response = await apiClient.get<ApiSchemeMappingsResponse>(
      '/api/v1/scheme/schemes/mappings',
      {
        params: {
          tenantCode: params.tenantCode,
          page: params.page,
          limit: params.limit,
          ...(params.schemeName ? { schemeName: params.schemeName } : {}),
          ...(params.sortDir ? { sortDir: params.sortDir } : {}),
        },
      }
    )
    return {
      items: response.data.content,
      totalElements: response.data.totalElements,
    }
  },

  // --- Real HTTP: Upload Scheme Mappings ---
  uploadSchemeMappings: async (file: File, tenantCode: string): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    await apiClient.post('/api/v1/scheme/schemes/mappings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Tenant-Code': tenantCode,
      },
    })
  },

  // --- Real HTTP: State/UT Admins ---
  getStateUTAdmins: async (
    tenantCode: string,
    params: { page: number; size: number; name?: string; status?: string }
  ): Promise<ApiUsersListResponse> => {
    const { name, status, ...rest } = params
    const query: Record<string, unknown> = { tenantCode, ...rest }
    if (name) query.name = name
    if (status) query.status = status
    const response = await apiClient.get<ApiEnvelope<ApiUsersListResponse>>(
      '/api/v1/users/state-admins',
      { params: query }
    )
    return response.data.data
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
      await apiClient.post(`/api/v1/users/${id}/deactivate`)
    } else {
      await apiClient.post(`/api/v1/users/${id}/activate`)
    }
  },
  inviteStateUTAdmin: async (payload: {
    firstName: string
    lastName: string
    phoneNumber: string
    email: string
    tenantCode: string
  }): Promise<void> => {
    await apiClient.post('/api/v1/users/invitations', {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
      email: payload.email,
      role: 'STATE_ADMIN',
      tenantCode: payload.tenantCode,
    })
  },

  reinviteStateUTAdmin: async (id: string): Promise<void> => {
    await apiClient.post(`/api/v1/users/${id}/invitations`)
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
  getMessageTemplates: () => httpProvider.getMessageTemplates(),
  getConfiguration: () => httpProvider.getConfiguration(),
  saveConfiguration: (payload: SaveConfigurationPayload) => httpProvider.saveConfiguration(payload),
  getSystemChannels: () => httpProvider.getSystemChannels(),
  getLogo: () => httpProvider.getLogo(),
  updateLogo: (file: File) => httpProvider.updateLogo(file),
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

  // --- Real HTTP: Broadcast Welcome Message ---
  broadcastWelcomeMessage: async (payload: BroadcastWelcomePayload): Promise<void> => {
    const tenantCode = useAuthStore.getState().user?.tenantCode
    if (!tenantCode) throw new Error('tenantCode unavailable — user not authenticated')
    await apiClient.post(`/api/v1/tenant/user/welcome?tenantCode=${tenantCode}`, payload)
  },

  // --- Real HTTP: Config Status ---
  getConfigStatus: async (): Promise<ConfigStatusMap> => {
    const tenantId = getTenantId()
    const response = await apiClient.get<
      ApiEnvelope<{ configs: Record<string, { status: string }> }>
    >(`/api/v1/tenants/${tenantId}/config/status`)
    const configs = response.data.data.configs
    const VALID_CONFIG_KEYS = new Set<string>([
      'TENANT_SUPPORTED_CHANNELS',
      'METER_CHANGE_REASONS',
      'AVERAGE_MEMBERS_PER_HOUSEHOLD',
      'DATA_CONSOLIDATION_TIME',
      'PUMP_OPERATOR_REMINDER_NUDGE_TIME',
      'LOCATION_CHECK_REQUIRED',
      'TENANT_LOGO',
      'SUPPORTED_LANGUAGES',
      'WATER_NORM',
      'TENANT_WATER_QUANTITY_SUPPLY_THRESHOLD',
      'MESSAGE_BROKER_CONNECTION_SETTINGS',
      'FIELD_STAFF_ESCALATION_RULES',
    ])
    const VALID_STATUSES = new Set<string>(['CONFIGURED', 'PENDING'])
    const result: ConfigStatusMap = {}
    for (const [key, val] of Object.entries(configs)) {
      if (!VALID_CONFIG_KEYS.has(key) || !VALID_STATUSES.has(val.status)) continue
      result[key as ConfigKey] = val.status as ConfigKeyStatus
    }
    return result
  },
}
