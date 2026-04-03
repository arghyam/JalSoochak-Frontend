import { useMutation, useQuery } from '@tanstack/react-query'
import { staffAuthApi } from '@/features/section-officer/services/api/staff-auth-api'
import type {
  OtpRequestPayload,
  OtpVerifyPayload,
} from '@/features/section-officer/types/staff-auth'

export const staffAuthQueryKeys = {
  tenants: () => ['staff', 'tenants'] as const,
}

export function usePublicTenantsQuery() {
  return useQuery({
    queryKey: staffAuthQueryKeys.tenants(),
    queryFn: () => staffAuthApi.getPublicTenants(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useRequestOtpMutation() {
  return useMutation({
    mutationFn: (payload: OtpRequestPayload) => staffAuthApi.requestOtp(payload),
  })
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: (payload: OtpVerifyPayload) => staffAuthApi.verifyOtp(payload),
  })
}
