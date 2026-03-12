import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { superAdminApi, type SaveSystemRulesPayload } from '../api/super-admin-api'
import { superAdminQueryKeys } from './super-admin-query-keys'
import type { SaveSystemConfigPayload } from '../../types/system-config'
import type {
  CreateStateUTInput,
  StateUTStatus,
  UpdateStateUTInput,
  StateAdminDetails,
} from '../../types/states-uts'
import type { CreateTenantInput } from '../../types/tenant'
import type { ApiCredentialsData } from '../../types/api-credentials'
import type { CreateSuperUserInput, UpdateSuperUserInput } from '../../types/super-users'

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

export function useStatesUTsQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.statesUTs(),
    queryFn: superAdminApi.getStatesUTsData,
  })
}

export function useStateAdminsQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.stateAdmins(),
    queryFn: superAdminApi.getStateAdminsData,
  })
}

export function useStateUTByIdQuery(id?: string) {
  return useQuery({
    queryKey: superAdminQueryKeys.stateUTById(id ?? ''),
    queryFn: () => superAdminApi.getStateUTById(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useAssignedStateNamesQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.assignedStateNames(),
    queryFn: superAdminApi.getAssignedStateNames,
  })
}

export function useStateUTOptionsQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.stateUTOptions(),
    queryFn: superAdminApi.getStateUTOptions,
  })
}

export function useCreateStateUTMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateStateUTInput) => superAdminApi.createStateUT(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.statesUTs() })
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.assignedStateNames() })
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.stateUTOptions() })
    },
  })
}

export function useCreateStateAdminMutation() {
  return useMutation({
    mutationFn: ({ tenantId, admin }: { tenantId: string; admin: StateAdminDetails }) =>
      superAdminApi.createStateAdmin(tenantId, admin),
  })
}

export function useCreateTenantMutation() {
  return useMutation({
    mutationFn: (payload: CreateTenantInput) => superAdminApi.createTenant(payload),
  })
}

export function useUpdateStateUTMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStateUTInput }) =>
      superAdminApi.updateStateUT(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.statesUTs() })
      await queryClient.invalidateQueries({
        queryKey: superAdminQueryKeys.stateUTById(variables.id),
      })
    },
  })
}

export function useUpdateStateUTStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StateUTStatus }) =>
      superAdminApi.updateStateUTStatus(id, status),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.statesUTs() })
      await queryClient.invalidateQueries({
        queryKey: superAdminQueryKeys.stateUTById(variables.id),
      })
    },
  })
}

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

export function useCreateSuperUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSuperUserInput) => superAdminApi.createSuperUser(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.superUsers() })
    },
  })
}

export function useUpdateSuperUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSuperUserInput }) =>
      superAdminApi.updateSuperUser(id, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.superUsers() })
      await queryClient.invalidateQueries({
        queryKey: superAdminQueryKeys.superUserById(variables.id),
      })
    },
  })
}

export function useUpdateSuperUserStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      superAdminApi.updateSuperUserStatus(id, status),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.superUsers() })
      await queryClient.invalidateQueries({
        queryKey: superAdminQueryKeys.superUserById(variables.id),
      })
    },
  })
}

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
