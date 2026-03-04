import { apiClient } from '@/shared/lib/axios'
import {
  createStateUT,
  createStateAdmin,
  generateApiKey,
  getAssignedStateNames,
  getStateUTOptions,
  getMockApiCredentialsData,
  getMockIngestionMonitorData,
  getMockStateAdminsData,
  getMockStatesUTsData,
  getMockSuperAdminOverviewData,
  getMockSystemRulesConfiguration,
  getStateUTById,
  mockCreateTenant,
  saveMockSystemRulesConfiguration,
  sendApiKey,
  updateStateUT,
  updateStateUTStatus,
} from '../mock-data'
import type { ApiCredentialsData } from '../../types/api-credentials'
import type { IngestionMonitorData } from '../../types/ingestion-monitor'
import type { SuperAdminOverviewData } from '../../types/overview'
import type {
  CreateStateUTInput,
  CreateTenantAdminApiResponse,
  CreateTenantAdminRequest,
  StateUT,
  StateUTStatus,
  StateUTOption,
  UpdateStateUTInput,
  StateAdminDetails,
} from '../../types/states-uts'
import type { CreateTenantInput, CreateTenantResponse } from '../../types/tenant'
import type { SystemRulesConfiguration } from '../../types/system-rules'
import type { StateAdmin } from '../../types/state-admins'

export type SaveSystemRulesPayload = Omit<SystemRulesConfiguration, 'id'>
export type IngestionMonitorFilters = {
  stateFilter?: string
  timeFilter?: string
}

type SuperAdminDataProvider = {
  getOverviewData: () => Promise<SuperAdminOverviewData>
  getSystemRulesConfiguration: () => Promise<SystemRulesConfiguration>
  saveSystemRulesConfiguration: (
    payload: SaveSystemRulesPayload
  ) => Promise<SystemRulesConfiguration>
  getIngestionMonitorData: (filters?: IngestionMonitorFilters) => Promise<IngestionMonitorData>
  getApiCredentialsData: () => Promise<ApiCredentialsData>
  generateApiKey: (stateId: string) => Promise<string>
  sendApiKey: (stateId: string) => Promise<{ success: boolean }>
  getStatesUTsData: () => Promise<StateUT[]>
  getStateAdminsData: () => Promise<StateAdmin[]>
  getStateUTById: (id: string) => Promise<StateUT>
  createStateUT: (payload: CreateStateUTInput) => Promise<StateUT>
  updateStateUT: (id: string, payload: UpdateStateUTInput) => Promise<StateUT>
  updateStateUTStatus: (id: string, status: StateUTStatus) => Promise<StateUT>
  getAssignedStateNames: () => Promise<string[]>
  getStateUTOptions: () => Promise<StateUTOption[]>
  createStateAdmin: (
    tenantId: string,
    admin: StateAdminDetails
  ) => Promise<{ success: boolean } | CreateTenantAdminApiResponse>
  createTenant: (payload: CreateTenantInput) => Promise<CreateTenantResponse['data']>
}

const httpProvider: SuperAdminDataProvider = {
  getOverviewData: async () => {
    const response = await apiClient.get<SuperAdminOverviewData>('/api/super-admin/overview')
    return response.data
  },
  getSystemRulesConfiguration: async () => {
    const response = await apiClient.get<SystemRulesConfiguration>(
      '/api/super-admin/system-rules-configuration'
    )
    return response.data
  },
  saveSystemRulesConfiguration: async (payload) => {
    const response = await apiClient.put<SystemRulesConfiguration>(
      '/api/super-admin/system-rules-configuration',
      payload
    )
    return response.data
  },
  getIngestionMonitorData: async (filters) => {
    const response = await apiClient.get<IngestionMonitorData>(
      '/api/super-admin/ingestion-monitor',
      {
        params: {
          state: filters?.stateFilter,
          days: filters?.timeFilter,
        },
      }
    )
    return response.data
  },
  getApiCredentialsData: async () => {
    const response = await apiClient.get<ApiCredentialsData>('/api/super-admin/api-credentials')
    return response.data
  },
  generateApiKey: async (stateId) => {
    const response = await apiClient.post<{ apiKey: string }>(
      `/api/super-admin/api-credentials/${stateId}/generate-key`
    )
    return response.data.apiKey
  },
  sendApiKey: async (stateId) => {
    const response = await apiClient.post<{ success: boolean }>(
      `/api/super-admin/api-credentials/${stateId}/send-key`
    )
    return response.data
  },
  getStatesUTsData: async () => {
    const response = await apiClient.get<StateUT[]>('/api/super-admin/states-uts')
    return response.data
  },
  getStateAdminsData: async () => {
    const response = await apiClient.get<StateAdmin[]>('/api/super-admin/state-admins')
    return response.data
  },
  getStateUTById: async (id) => {
    const response = await apiClient.get<StateUT>(`/api/super-admin/states-uts/${id}`)
    return response.data
  },
  createStateUT: async (payload) => {
    const response = await apiClient.post<StateUT>('/api/super-admin/states-uts', payload)
    return response.data
  },
  updateStateUT: async (id, payload) => {
    const response = await apiClient.put<StateUT>(`/api/super-admin/states-uts/${id}`, payload)
    return response.data
  },
  updateStateUTStatus: async (id, status) => {
    const response = await apiClient.patch<StateUT>(`/api/super-admin/states-uts/${id}/status`, {
      status,
    })
    return response.data
  },
  getAssignedStateNames: async () => {
    const response = await apiClient.get<string[]>(
      '/api/super-admin/states-uts/assigned-state-names'
    )
    return response.data
  },
  getStateUTOptions: async () => {
    const response = await apiClient.get<StateUTOption[]>('/api/super-admin/states-uts/options')
    return response.data
  },
  createStateAdmin: async (tenantId: string, admin: StateAdminDetails) => {
    const body: CreateTenantAdminRequest = {
      firstName: admin.firstName,
      lastName: admin.lastName,
      primaryEmail: admin.email,
      primaryPhone: admin.phone,
      role: 'TENANT_ADMIN',
    }
    if (admin.secondaryEmail) body.secondaryEmail = admin.secondaryEmail
    if (admin.contactNumber) body.secondaryPhone = admin.contactNumber
    const response = await apiClient.post<CreateTenantAdminApiResponse>('/api/v2/users', body, {
      headers: { 'X-Tenant-Id': tenantId },
    })
    return response.data
  },
  createTenant: async (payload: CreateTenantInput) => {
    const response = await apiClient.post<CreateTenantResponse>('/api/v1/tenants', payload, {
      headers: { 'X-Tenant-Code': payload.stateCode },
    })
    return response.data.data
  },
}

const mockProvider: SuperAdminDataProvider = {
  getOverviewData: () => getMockSuperAdminOverviewData(),
  getSystemRulesConfiguration: () => getMockSystemRulesConfiguration(),
  saveSystemRulesConfiguration: (payload) => saveMockSystemRulesConfiguration(payload),
  getIngestionMonitorData: (_filters) => getMockIngestionMonitorData(),
  getApiCredentialsData: () => getMockApiCredentialsData(),
  generateApiKey: (stateId) => generateApiKey(stateId),
  sendApiKey: (stateId) => sendApiKey(stateId),
  getStatesUTsData: () => getMockStatesUTsData(),
  getStateAdminsData: () => getMockStateAdminsData(),
  getStateUTById: (id) => getStateUTById(id),
  createStateUT: (payload) => createStateUT(payload),
  updateStateUT: (id, payload) => updateStateUT(id, payload),
  updateStateUTStatus: (id, status) => updateStateUTStatus(id, status),
  getAssignedStateNames: async () => getAssignedStateNames(),
  getStateUTOptions: () => getStateUTOptions(),
  createStateAdmin: (tenantId: string, admin: StateAdminDetails) =>
    createStateAdmin(tenantId, admin),
  createTenant: (payload: CreateTenantInput) => mockCreateTenant(payload),
}

const SUPER_ADMIN_PROVIDER = import.meta.env.VITE_SUPER_ADMIN_DATA_PROVIDER ?? 'mock'
const provider: SuperAdminDataProvider =
  SUPER_ADMIN_PROVIDER === 'http' ? httpProvider : mockProvider

export const superAdminApi = {
  getOverviewData: () => provider.getOverviewData(),
  getSystemRulesConfiguration: () => provider.getSystemRulesConfiguration(),
  saveSystemRulesConfiguration: (payload: SaveSystemRulesPayload) =>
    provider.saveSystemRulesConfiguration(payload),
  getIngestionMonitorData: (filters?: IngestionMonitorFilters) =>
    provider.getIngestionMonitorData(filters),
  getApiCredentialsData: () => provider.getApiCredentialsData(),
  generateApiKey: (stateId: string) => provider.generateApiKey(stateId),
  sendApiKey: (stateId: string) => provider.sendApiKey(stateId),
  getStatesUTsData: () => provider.getStatesUTsData(),
  getStateAdminsData: () => provider.getStateAdminsData(),
  getStateUTById: (id: string) => provider.getStateUTById(id),
  createStateUT: (payload: CreateStateUTInput) => provider.createStateUT(payload),
  updateStateUT: (id: string, payload: UpdateStateUTInput) => provider.updateStateUT(id, payload),
  updateStateUTStatus: (id: string, status: StateUTStatus) =>
    provider.updateStateUTStatus(id, status),
  getAssignedStateNames: () => provider.getAssignedStateNames(),
  getStateUTOptions: () => provider.getStateUTOptions(),
  createStateAdmin: (tenantId: string, admin: StateAdminDetails) =>
    provider.createStateAdmin(tenantId, admin),
  createTenant: (payload: CreateTenantInput) => provider.createTenant(payload),
}
