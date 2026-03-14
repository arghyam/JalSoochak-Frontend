import { apiClient } from '@/shared/lib/axios'
import { isAxiosError } from 'axios'
import {
  generateApiKey,
  getMockApiCredentialsData,
  getMockIngestionMonitorData,
  getMockSuperAdminOverviewData,
  getMockSystemRulesConfiguration,
  saveMockSystemRulesConfiguration,
  sendApiKey,
} from '../mock-data'
import type { ApiCredentialsData } from '../../types/api-credentials'
import type { IngestionMonitorData } from '../../types/ingestion-monitor'
import type { SuperAdminOverviewData } from '../../types/overview'
import type { SystemRulesConfiguration } from '../../types/system-rules'
import type { SystemConfiguration, SaveSystemConfigPayload } from '../../types/system-config'
import type { StateAdmin } from '../../types/state-admins'
import type { Tenant, TenantApiResponse, TenantsListApiResponse } from '../../types/states-uts'
import { mapTenantApiToTenant as mapTenant } from '../../types/states-uts'
import type {
  ApiUser,
  ApiUsersListResponse,
  InviteUserRequest,
  UpdateUserRequest,
} from '../../types/super-users'
import { mapApiUserToUserAdminData } from '../../types/super-users'
import type { UserAdminData } from '@/shared/components/common'
import {
  mapApiResponseToSystemConfig,
  mapSystemConfigToApiPayload,
} from '../../types/system-config'

export { mapApiUserToUserAdminData } from '../../types/super-users'

export type SaveSystemRulesPayload = Omit<SystemRulesConfiguration, 'id'>
export type IngestionMonitorFilters = {
  stateFilter?: string
  timeFilter?: string
}

const SYSTEM_CONFIG_KEYS = [
  'SYSTEM_SUPPORTED_CHANNELS',
  'WATER_QUANTITY_SUPPLY_THRESHOLD',
  'BFM_IMAGE_READING_CONFIDENCE_LEVEL_THRESHOLD',
  'LOCATION_AFFINITY_THRESHOLD',
].join(',')

// ── Real API response wrappers ────────────────────────────────────────────────

interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

// ── superAdminApi ─────────────────────────────────────────────────────────────

export const superAdminApi = {
  // ── Mock (not yet migrated) ─────────────────────────────────────────────────
  getOverviewData: (): Promise<SuperAdminOverviewData> => getMockSuperAdminOverviewData(),

  getSystemRulesConfiguration: (): Promise<SystemRulesConfiguration> =>
    getMockSystemRulesConfiguration(),

  saveSystemRulesConfiguration: (
    payload: SaveSystemRulesPayload
  ): Promise<SystemRulesConfiguration> => saveMockSystemRulesConfiguration(payload),

  getIngestionMonitorData: (_filters?: IngestionMonitorFilters): Promise<IngestionMonitorData> =>
    getMockIngestionMonitorData(),

  getApiCredentialsData: (): Promise<ApiCredentialsData> => getMockApiCredentialsData(),

  generateApiKey: (stateId: string): Promise<string> => generateApiKey(stateId),

  sendApiKey: (stateId: string): Promise<{ success: boolean }> => sendApiKey(stateId),

  // ── Real HTTP: System Configuration ────────────────────────────────────────
  getSystemConfiguration: async (): Promise<SystemConfiguration> => {
    const response = await apiClient.get<{ data: { configs: Record<string, unknown> } }>(
      `/api/v1/system/config?keys=${SYSTEM_CONFIG_KEYS}`
    )
    return mapApiResponseToSystemConfig(
      response.data.data.configs as Parameters<typeof mapApiResponseToSystemConfig>[0]
    )
  },

  saveSystemConfiguration: async (
    payload: SaveSystemConfigPayload
  ): Promise<SystemConfiguration> => {
    const body = mapSystemConfigToApiPayload(payload)
    const response = await apiClient.put<{ data: { configs: Record<string, unknown> } }>(
      '/api/v1/system/config',
      body
    )
    return mapApiResponseToSystemConfig(
      response.data.data.configs as Parameters<typeof mapApiResponseToSystemConfig>[0]
    )
  },

  // ── Real HTTP: Tenants (States/UTs) ────────────────────────────────────────
  getStatesUTsData: async (): Promise<Tenant[]> => {
    const pageSize = 100
    const firstResponse = await apiClient.get<ApiResponse<TenantsListApiResponse>>(
      '/api/v1/tenants',
      { params: { page: 0, size: pageSize } }
    )
    const firstPage = firstResponse.data.data
    const allContent = [...firstPage.content]

    for (let page = 1; page < firstPage.totalPages; page++) {
      const response = await apiClient.get<ApiResponse<TenantsListApiResponse>>('/api/v1/tenants', {
        params: { page, size: pageSize },
      })
      allContent.push(...response.data.data.content)
    }

    return allContent.map((t) => mapTenant(t))
  },

  getTenantById: async (id: number): Promise<Tenant | null> => {
    try {
      const response = await apiClient.get<ApiResponse<TenantApiResponse>>(`/api/v1/tenants/${id}`)
      return mapTenant(response.data.data)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null
      throw error
    }
  },

  createTenant: async (payload: { stateCode: string; name: string }): Promise<Tenant> => {
    const response = await apiClient.post<ApiResponse<TenantApiResponse>>(
      '/api/v1/tenants',
      payload
    )
    return mapTenant(response.data.data)
  },

  updateTenantStatus: async (id: number, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => {
    if (status === 'INACTIVE') {
      await apiClient.put(`/api/v1/tenants/${id}/deactivate`)
    } else {
      await apiClient.put(`/api/v1/tenants/${id}`, { status: 'ACTIVE' })
    }
  },

  // ── Real HTTP: State Admins (by tenant) ────────────────────────────────────
  getStateAdminsByTenant: async (tenantCode: string): Promise<UserAdminData[]> => {
    const response = await apiClient.get<ApiResponse<ApiUsersListResponse>>(
      '/api/v1/users/state-admins',
      { params: { tenantCode } }
    )
    return response.data.data.content.map(mapApiUserToUserAdminData)
  },

  /** Kept for ManageStateAdminsPage which fetches all state admins (no tenantCode). */
  getStateAdminsData: async (): Promise<StateAdmin[]> => {
    const response = await apiClient.get<ApiResponse<ApiUsersListResponse>>(
      '/api/v1/users/state-admins'
    )
    return response.data.data.content.map((u: ApiUser) => ({
      id: String(u.id),
      adminName: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
      stateUt: u.tenantCode ?? '',
      mobileNumber: u.phoneNumber,
      emailAddress: u.email,
      signupStatus: u.active ? ('completed' as const) : ('pending' as const),
    }))
  },

  // ── Real HTTP: Users (super users + generic update/status) ─────────────────
  getSuperUsers: async (): Promise<UserAdminData[]> => {
    const response = await apiClient.get<ApiResponse<ApiUsersListResponse>>(
      '/api/v1/users/super-users'
    )
    return response.data.data.content.map(mapApiUserToUserAdminData)
  },

  getSuperUserById: async (id: string): Promise<UserAdminData | null> => {
    try {
      const response = await apiClient.get<ApiResponse<ApiUser>>(`/api/v1/users/${id}`)
      return mapApiUserToUserAdminData(response.data.data)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null
      throw error
    }
  },

  inviteUser: async (payload: InviteUserRequest): Promise<void> => {
    await apiClient.post('/api/v1/users/invite', payload)
  },

  updateUser: async (id: string, payload: UpdateUserRequest): Promise<void> => {
    await apiClient.patch(`/api/v1/users/${id}`, payload)
  },

  updateUserStatus: async (id: string, status: 'active' | 'inactive'): Promise<void> => {
    if (status === 'inactive') {
      await apiClient.put(`/api/v1/users/${id}/deactivate`)
    } else {
      await apiClient.put(`/api/v1/users/${id}/activate`)
    }
  },
}
