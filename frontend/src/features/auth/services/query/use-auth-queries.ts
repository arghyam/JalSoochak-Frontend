import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/app/store'
import { authApi } from '@/features/auth/services/auth-api'
import type {
  UpdateMyProfileRequest,
  ChangeMyPasswordRequest,
  ResetPasswordRequest,
} from '@/features/auth/services/auth-api'
import { authQueryKeys } from './auth-query-keys'

export function useMyProfileQuery() {
  return useQuery({
    queryKey: authQueryKeys.me(),
    queryFn: () => authApi.getMyProfile(),
  })
}

export function useUpdateMyProfileMutation() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  return useMutation({
    mutationFn: (payload: UpdateMyProfileRequest) => authApi.updateMyProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(authQueryKeys.me(), data)
      if (user) {
        updateUser({
          ...user,
          name: `${data.firstName} ${data.lastName}`.trim(),
          phoneNumber: data.phoneNumber,
        })
      }
    },
  })
}

export function useChangeMyPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangeMyPasswordRequest) => authApi.changeMyPassword(payload),
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) => authApi.resetPassword(payload),
  })
}
