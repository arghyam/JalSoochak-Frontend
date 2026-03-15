import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { superAdminApi, type SaveSystemRulesPayload } from '../api/super-admin-api'
import { superAdminQueryKeys } from './super-admin-query-keys'
import type { SaveSystemConfigPayload } from '../../types/system-config'
import type { ApiCredentialsData } from '../../types/api-credentials'
import type { InviteUserRequest, UpdateUserRequest } from '../../types/super-users'

// ── Overview & System Rules ──────────────────────────────────────────────────

export function useSuperAdminOverviewQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.overview(),
    queryFn: superAdminApi.getOverviewData,
  })
}

export function useSystemRulesConfigurationQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.systemRulesConfiguration(),
    queryFn: superAdminApi.getSystemRulesConfiguration,
  })
}

export function useSaveSystemRulesConfigurationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveSystemRulesPayload) =>
      superAdminApi.saveSystemRulesConfiguration(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(superAdminQueryKeys.systemRulesConfiguration(), data)
    },
  })
}

// ── Ingestion Monitor & API Credentials ─────────────────────────────────────

export function useIngestionMonitorQuery(stateFilter: string, timeFilter: string) {
  return useQuery({
    queryKey: superAdminQueryKeys.ingestionMonitor(stateFilter, timeFilter),
    queryFn: () => superAdminApi.getIngestionMonitorData({ stateFilter, timeFilter }),
  })
}

export function useApiCredentialsQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.apiCredentials(),
    queryFn: superAdminApi.getApiCredentialsData,
  })
}

export function useGenerateApiKeyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (stateId: string) => superAdminApi.generateApiKey(stateId),
    onSuccess: (newApiKey, stateId) => {
      queryClient.setQueryData(
        superAdminQueryKeys.apiCredentials(),
        (previous: ApiCredentialsData | undefined) => {
          if (!previous) return previous
          return {
            ...previous,
            credentials: previous.credentials.map((credential) =>
              credential.id === stateId ? { ...credential, apiKey: newApiKey } : credential
            ),
          }
        }
      )
    },
  })
}

export function useSendApiKeyMutation() {
  return useMutation({
    mutationFn: (stateId: string) => superAdminApi.sendApiKey(stateId),
  })
}

// ── States/UTs (Tenants) ─────────────────────────────────────────────────────

export function useStatesUTsQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.statesUTs(),
    queryFn: superAdminApi.getStatesUTsData,
  })
}

/** Fetch state admins for a specific tenant (used by view/edit pages). */
export function useStateAdminsByTenantQuery(tenantCode?: string) {
  return useQuery({
    queryKey: superAdminQueryKeys.stateAdminsByTenant(tenantCode ?? ''),
    queryFn: () => superAdminApi.getStateAdminsByTenant(tenantCode!),
    enabled: Boolean(tenantCode),
  })
}

/** Fetch all state admins (for ManageStateAdminsPage). */
export function useStateAdminsQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.stateAdmins(),
    queryFn: superAdminApi.getStateAdminsData,
  })
}

export function useCreateTenantMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { stateCode: string; name: string }) =>
      superAdminApi.createTenant(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.statesUTs() })
    },
  })
}

export function useUpdateTenantStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ACTIVE' | 'INACTIVE' }) =>
      superAdminApi.updateTenantStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.statesUTs() })
    },
  })
}

// ── Invite & Update Users ────────────────────────────────────────────────────

export function useInviteUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: InviteUserRequest) => superAdminApi.inviteUser(payload),
    onSuccess: async (_data, variables) => {
      if (variables.role === 'SUPER_USER') {
        await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.superUsers() })
      } else if (variables.tenantCode) {
        // STATE_ADMIN: invalidate list for that tenant
        await queryClient.invalidateQueries({
          queryKey: superAdminQueryKeys.stateAdminsByTenant(variables.tenantCode),
        })
      }
    },
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRequest }) =>
      superAdminApi.updateUser(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: superAdminQueryKeys.superUserById(variables.id),
      })
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.superUsers() })
    },
  })
}

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      superAdminApi.updateUserStatus(id, status),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: superAdminQueryKeys.superUserById(variables.id),
      })
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.superUsers() })
    },
  })
}

// ── Super Users ──────────────────────────────────────────────────────────────

export function useSuperUsersQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.superUsers(),
    queryFn: superAdminApi.getSuperUsers,
  })
}

export function useSuperUserByIdQuery(id?: string) {
  return useQuery({
    queryKey: superAdminQueryKeys.superUserById(id ?? ''),
    queryFn: () => superAdminApi.getSuperUserById(id ?? ''),
    enabled: Boolean(id),
  })
}

// ── System Configuration ────────────────────────────────────────────────────

export function useSystemConfigurationQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.systemConfiguration(),
    queryFn: superAdminApi.getSystemConfiguration,
  })
}

export function useSaveSystemConfigurationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveSystemConfigPayload) =>
      superAdminApi.saveSystemConfiguration(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(superAdminQueryKeys.systemConfiguration(), data)
    },
  })
}
