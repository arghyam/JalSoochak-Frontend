import { apiClient } from '@/shared/lib/axios'
import { isAxiosError } from 'axios'
import type { SuperAdminStats } from '../../types/overview'
import type { SystemConfiguration, SaveSystemConfigPayload } from '../../types/system-config'
import type {
  Tenant,
  TenantApiResponse,
  TenantStatus,
  TenantsListApiResponse,
} from '../../types/states-uts'
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

  // ── Real HTTP: Tenants Summary ─────────────────────────────────────────────
  getTenantsSummary: async (): Promise<SuperAdminStats> => {
    const response = await apiClient.get<
      ApiResponse<{
        totalTenants: number
        activeTenants: number
        inactiveTenants: number
        archivedTenants: number
      }>
    >('/api/v1/tenants/summary')
    const { totalTenants, activeTenants, inactiveTenants } = response.data.data
    return {
      totalStatesManaged: totalTenants,
      activeStates: activeTenants,
      inactiveStates: inactiveTenants,
    }
  },

  // ── Real HTTP: Tenants (States/UTs) ────────────────────────────────────────
  /** Single-page fetch used by the list page (user-controlled page + size). */
  getStatesUTsPage: async (params: {
    page: number
    size: number
    search?: string
    status?: string
  }): Promise<{ items: Tenant[]; total: number }> => {
    const { search, status, ...rest } = params
    const query: Record<string, unknown> = { ...rest }
    if (search) query.search = search
    if (status) query.status = status
    const response = await apiClient.get<ApiResponse<TenantsListApiResponse>>('/api/v1/tenants', {
      params: query,
    })
    const data = response.data.data
    return { items: data.content.map(mapTenant), total: data.totalElements }
  },

  /** All-pages fetch used by view/edit pages that need to find a tenant by stateCode in memory. */
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

  createTenant: async (payload: {
    stateCode: string
    name: string
    lgdCode: number
  }): Promise<Tenant> => {
    const response = await apiClient.post<ApiResponse<TenantApiResponse>>(
      '/api/v1/tenants',
      payload
    )
    return mapTenant(response.data.data)
  },

  updateTenantStatus: async (id: number, status: TenantStatus): Promise<void> => {
    if (status === 'INACTIVE') {
      await apiClient.put(`/api/v1/tenants/${id}/deactivate`)
    } else {
      await apiClient.put(`/api/v1/tenants/${id}`, { status })
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
  getStateAdminsData: async (params: {
    page: number
    size: number
  }): Promise<ApiUsersListResponse> => {
    const response = await apiClient.get<ApiResponse<ApiUsersListResponse>>(
      '/api/v1/users/state-admins',
      { params }
    )
    return response.data.data
  },

  // ── Real HTTP: Users (super users + generic update/status) ─────────────────
  getSuperUsers: async (params: { page: number; size: number }): Promise<ApiUsersListResponse> => {
    const response = await apiClient.get<ApiResponse<ApiUsersListResponse>>(
      '/api/v1/users/super-users',
      { params }
    )
    return response.data.data
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

  reinviteUser: async (id: string): Promise<void> => {
    await apiClient.post(`/api/v1/users/${id}/reinvite`)
  },
}
