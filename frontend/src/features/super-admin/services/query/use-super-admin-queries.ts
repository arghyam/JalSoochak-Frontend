import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { superAdminApi, mapApiUserToUserAdminData } from '../api/super-admin-api'
import { superAdminQueryKeys } from './super-admin-query-keys'
import type { TenantStatus } from '../../types/states-uts'
import type { SaveSystemConfigPayload } from '../../types/system-config'
import type { InviteUserRequest, UpdateUserRequest, ApiUser } from '../../types/super-users'
import type { StateAdmin } from '../../types/state-admins'

export function useTenantsSummaryQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.tenantsSummary(),
    queryFn: superAdminApi.getTenantsSummary,
  })
}

// ── States/UTs (Tenants) ─────────────────────────────────────────────────────

/** All-pages query — used by view/edit pages that find a tenant by stateCode in memory. */
export function useStatesUTsQuery() {
  return useQuery({
    queryKey: superAdminQueryKeys.statesUTs(),
    queryFn: superAdminApi.getStatesUTsData,
  })
}

/** Paginated query — used by the list page with user-controlled page + size + search + status. */
export function useStatesUTsPagedQuery(
  page: number,
  pageSize: number,
  search: string,
  status: string
) {
  return useQuery({
    queryKey: superAdminQueryKeys.statesUTsPaged(page, pageSize, search, status),
    queryFn: () =>
      superAdminApi.getStatesUTsPage({
        page: page - 1,
        size: pageSize,
        search: search || undefined,
        status: status && status !== 'all' ? status : undefined,
      }),
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
export function useStateAdminsQuery(page: number, pageSize: number, name: string, status: string) {
  return useQuery({
    queryKey: superAdminQueryKeys.stateAdmins(page, pageSize, name, status),
    queryFn: async () => {
      const apiPage = await superAdminApi.getStateAdminsData({
        page: page - 1,
        size: pageSize,
        name: name || undefined,
        status: status && status !== 'all' ? status : undefined,
      })
      const items: StateAdmin[] = apiPage.content.map((u: ApiUser) => {
        let signupStatus: StateAdmin['signupStatus']
        if (u.status === 'ACTIVE') {
          signupStatus = 'completed'
        } else if (u.status === 'INACTIVE') {
          signupStatus = 'inactive'
        } else {
          signupStatus = 'pending'
        }
        return {
          id: String(u.id),
          adminName: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
          stateUt: u.tenantCode ?? '',
          mobileNumber: u.phoneNumber,
          emailAddress: u.email,
          signupStatus,
        }
      })
      return {
        items,
        total: apiPage.totalElements,
      }
    },
  })
}

export function useCreateTenantMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { stateCode: string; name: string; lgdCode: number }) =>
      superAdminApi.createTenant(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: superAdminQueryKeys.statesUTs() })
    },
  })
}

export function useUpdateTenantStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TenantStatus }) =>
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
        await queryClient.invalidateQueries({
          queryKey: [...superAdminQueryKeys.all, 'super-users'],
        })
      } else if (variables.tenantCode) {
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
      await queryClient.invalidateQueries({
        queryKey: [...superAdminQueryKeys.all, 'super-users'],
      })
      await queryClient.invalidateQueries({
        queryKey: [...superAdminQueryKeys.all, 'state-admins'],
      })
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
      await queryClient.invalidateQueries({
        queryKey: [...superAdminQueryKeys.all, 'super-users'],
      })
    },
  })
}

export function useReinviteSuperUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => superAdminApi.reinviteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...superAdminQueryKeys.all, 'super-users'],
      })
    },
  })
}

export function useReinviteStateAdminMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => superAdminApi.reinviteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...superAdminQueryKeys.all, 'state-admins'],
      })
    },
  })
}

// ── Super Users ──────────────────────────────────────────────────────────────

export function useSuperUsersQuery(page: number, pageSize: number, status: string) {
  return useQuery({
    queryKey: superAdminQueryKeys.superUsers(page, pageSize, status),
    queryFn: async () => {
      const apiPage = await superAdminApi.getSuperUsers({
        page: page - 1,
        size: pageSize,
        status: status && status !== 'all' ? status : undefined,
      })
      return {
        items: apiPage.content.map(mapApiUserToUserAdminData),
        total: apiPage.totalElements,
      }
    },
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
