import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  stateAdminApi,
  type SaveConfigurationPayload,
  type SaveEscalationPayload,
  type SaveIntegrationConfigurationPayload,
  type SaveLanguageConfigurationPayload,
  type SaveThresholdConfigurationPayload,
  type SaveWaterNormsConfigurationPayload,
  type UpdateNudgeTemplatePayload,
} from '../api/state-admin-api'
import type { SaveEscalationRulesPayload } from '../../types/escalation-rules'
import type { HierarchyLevel } from '../../types/hierarchy'
import { stateAdminQueryKeys } from './state-admin-query-keys'
import { useAuthStore } from '@/app/store/auth-store'

export function useStateAdminOverviewQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.overview(),
    queryFn: stateAdminApi.getOverviewData,
  })
}

export function useStateAdminActivityQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.activity(),
    queryFn: stateAdminApi.getActivityData,
  })
}

export function useLanguageConfigurationQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.languageConfiguration(),
    queryFn: stateAdminApi.getLanguageConfiguration,
  })
}

export function useSaveLanguageConfigurationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveLanguageConfigurationPayload) =>
      stateAdminApi.saveLanguageConfiguration(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(stateAdminQueryKeys.languageConfiguration(), data)
    },
  })
}

export function useIntegrationConfigurationQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.integrationConfiguration(),
    queryFn: stateAdminApi.getIntegrationConfiguration,
  })
}

export function useSaveIntegrationConfigurationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveIntegrationConfigurationPayload) =>
      stateAdminApi.saveIntegrationConfiguration(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(stateAdminQueryKeys.integrationConfiguration(), data)
    },
  })
}

export function useWaterNormsConfigurationQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.waterNormsConfiguration(),
    queryFn: stateAdminApi.getWaterNormsConfiguration,
  })
}

export function useSaveWaterNormsConfigurationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveWaterNormsConfigurationPayload) =>
      stateAdminApi.saveWaterNormsConfiguration(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(stateAdminQueryKeys.waterNormsConfiguration(), data)
    },
  })
}

export function useEscalationsQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.escalations(),
    queryFn: stateAdminApi.getEscalations,
  })
}

export function useCreateEscalationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveEscalationPayload) => stateAdminApi.createEscalation(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stateAdminQueryKeys.escalations() })
    },
  })
}

export function useUpdateEscalationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaveEscalationPayload }) =>
      stateAdminApi.updateEscalation(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: stateAdminQueryKeys.escalations() })
      queryClient.removeQueries({ queryKey: stateAdminQueryKeys.escalationById(variables.id) })
    },
  })
}

export function useDeleteEscalationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stateAdminApi.deleteEscalation(id),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: stateAdminQueryKeys.escalations() })
      queryClient.removeQueries({ queryKey: stateAdminQueryKeys.escalationById(id) })
    },
  })
}

export function useThresholdConfigurationQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.thresholdConfiguration(),
    queryFn: stateAdminApi.getThresholdConfiguration,
  })
}

export function useSaveThresholdConfigurationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveThresholdConfigurationPayload) =>
      stateAdminApi.saveThresholdConfiguration(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(stateAdminQueryKeys.thresholdConfiguration(), data)
    },
  })
}

export function useMessageTemplatesQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.messageTemplates(),
    queryFn: stateAdminApi.getMessageTemplates,
  })
}

export function useNudgeTemplatesQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.nudgeTemplates(),
    queryFn: stateAdminApi.getNudgeTemplates,
  })
}

export function useUpdateNudgeTemplateMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateNudgeTemplatePayload }) =>
      stateAdminApi.updateNudgeTemplate(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stateAdminQueryKeys.nudgeTemplates() })
    },
  })
}

export function useStaffSyncQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.staffSync(),
    queryFn: stateAdminApi.getStaffSyncData,
  })
}

export function useConfigurationQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.configuration(),
    queryFn: stateAdminApi.getConfiguration,
  })
}

export function useSaveConfigurationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveConfigurationPayload) => stateAdminApi.saveConfiguration(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(stateAdminQueryKeys.configuration(), data)
    },
  })
}

export function useStateUTAdminsQuery() {
  const tenantCode = useAuthStore((state) => state.user?.tenantCode ?? '')
  return useQuery({
    queryKey: stateAdminQueryKeys.stateUtAdmins(),
    queryFn: () => stateAdminApi.getStateUTAdmins(tenantCode),
    enabled: Boolean(tenantCode),
  })
}

export function useStateUTAdminByIdQuery(id: string | undefined) {
  return useQuery({
    queryKey: stateAdminQueryKeys.stateUtAdminById(id ?? ''),
    queryFn: () => stateAdminApi.getStateUTAdminById(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useInviteStateUTAdminMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { email: string; tenantCode: string }) =>
      stateAdminApi.inviteStateUTAdmin(payload.email, payload.tenantCode),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stateAdminQueryKeys.stateUtAdmins() })
    },
  })
}

export function useUpdateStateUTAdminMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: { firstName: string; lastName: string; phone: string }
    }) => stateAdminApi.updateStateUTAdmin(id, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: stateAdminQueryKeys.stateUtAdmins() })
      queryClient.removeQueries({ queryKey: stateAdminQueryKeys.stateUtAdminById(variables.id) })
    },
  })
}

export function useUpdateStateUTAdminStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      stateAdminApi.updateStateUTAdminStatus(id, status),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: stateAdminQueryKeys.stateUtAdmins() })
      queryClient.removeQueries({ queryKey: stateAdminQueryKeys.stateUtAdminById(variables.id) })
    },
  })
}

export function useReinviteStateUTAdminMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stateAdminApi.reinviteStateUTAdmin(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stateAdminQueryKeys.stateUtAdmins() })
    },
  })
}

export function useEscalationRulesQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.escalationRules(),
    queryFn: stateAdminApi.getEscalationRules,
  })
}

export function useSaveEscalationRulesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveEscalationRulesPayload) => stateAdminApi.saveEscalationRules(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(stateAdminQueryKeys.escalationRules(), data)
    },
  })
}

// ── Hierarchy ────────────────────────────────────────────────────────────────

export function useLgdHierarchyQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.lgdHierarchy(),
    queryFn: stateAdminApi.getLgdHierarchy,
  })
}

export function useDepartmentHierarchyQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.departmentHierarchy(),
    queryFn: stateAdminApi.getDepartmentHierarchy,
  })
}

export function useLgdEditConstraintsQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.lgdEditConstraints(),
    queryFn: stateAdminApi.getLgdEditConstraints,
  })
}

export function useDepartmentEditConstraintsQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.departmentEditConstraints(),
    queryFn: stateAdminApi.getDepartmentEditConstraints,
  })
}

export function useSaveLgdHierarchyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (levels: HierarchyLevel[]) => stateAdminApi.saveLgdHierarchy(levels),
    onSuccess: (data) => {
      queryClient.setQueryData(stateAdminQueryKeys.lgdHierarchy(), data)
    },
  })
}

export function useSaveDepartmentHierarchyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (levels: HierarchyLevel[]) => stateAdminApi.saveDepartmentHierarchy(levels),
    onSuccess: (data) => {
      queryClient.setQueryData(stateAdminQueryKeys.departmentHierarchy(), data)
    },
  })
}

export function useConfigStatusQuery() {
  return useQuery({
    queryKey: stateAdminQueryKeys.configStatus(),
    queryFn: stateAdminApi.getConfigStatus,
  })
}
