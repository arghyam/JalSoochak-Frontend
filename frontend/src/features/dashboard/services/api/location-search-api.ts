import type { StateUtSearchResponse } from '../../types'
import { dashboardApi } from './dashboard-api'
import type { TenantListContainer, TenantListItem, TenantListResponse } from './dashboard-api'

const toTenantListContainer = (value: unknown): TenantListContainer | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<TenantListContainer>
  return {
    content: Array.isArray(candidate.content) ? (candidate.content as TenantListItem[]) : undefined,
    totalElements:
      typeof candidate.totalElements === 'number' ? candidate.totalElements : undefined,
  }
}

const toStateValue = (stateName: string) =>
  stateName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const locationSearchApi = {
  getStatesUts: async (): Promise<StateUtSearchResponse> => {
    const responsePayload = (await dashboardApi.getTenants()) as TenantListResponse | undefined
    const firstLevel = toTenantListContainer(responsePayload)
    const secondLevel =
      responsePayload?.data && typeof responsePayload.data === 'object'
        ? toTenantListContainer((responsePayload.data as { data?: unknown }).data)
        : null
    const dataLevel = toTenantListContainer(responsePayload?.data)
    const resolved = secondLevel ?? dataLevel ?? firstLevel
    const content = resolved?.content ?? []
    const filteredTenants = content.filter((tenant: TenantListItem) => tenant.id !== 0)
    const states = filteredTenants.map((tenant: TenantListItem) => ({
      value: toStateValue(tenant.name),
      label: tenant.name,
    }))
    const totalStatesCount = states.length

    return {
      totalStatesCount,
      states,
    }
  },
}
