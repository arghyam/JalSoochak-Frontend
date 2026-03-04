import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  stateAdminApi,
  type SaveEscalationPayload,
  type SaveIntegrationConfigurationPayload,
  type SaveLanguageConfigurationPayload,
  type SaveThresholdConfigurationPayload,
  type SaveWaterNormsConfigurationPayload,
  type UpdateNudgeTemplatePayload,
} from '../api/state-admin-api'
import { stateAdminQueryKeys } from './state-admin-query-keys'

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
