import type { StateUtSearchResponse } from '../../types'
import { dashboardApi } from './dashboard-api'
import type { TenantListContainer, TenantListItem, TenantListResponse } from './dashboard-api'
import { slugify, toCapitalizedWords } from '../../utils/format-location-label'

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

export const locationSearchApi = {
  getStatesUts: async (): Promise<StateUtSearchResponse> => {
    const responsePayload = (await dashboardApi.getTenants()) as TenantListResponse | undefined
    const firstLevel = toTenantListContainer(responsePayload)
    const secondLevel =
      responsePayload?.data && typeof responsePayload.data === 'object'
        ? toTenantListContainer((responsePayload.data as { data?: unknown }).data)
        : null
    const dataLevel = toTenantListContainer(responsePayload?.data)
    const containers = [secondLevel, dataLevel, firstLevel]
    const resolvedWithContent = containers.find(
      (container) => Array.isArray(container?.content) && container.content.length > 0
    )
    const resolved = resolvedWithContent ?? secondLevel ?? dataLevel ?? firstLevel
    const content = resolved?.content ?? []
    const filteredTenants = content.filter((tenant: TenantListItem) => tenant.id !== 0)
    const states = filteredTenants.map((tenant: TenantListItem) => {
      const normalizedTenantName = toCapitalizedWords(tenant.name)
      const option = {
        value: slugify(tenant.name),
        label: normalizedTenantName,
      } as {
        value: string
        label: string
        tenantId?: number
        tenantCode?: string
      }

      if (typeof tenant.id === 'number') {
        option.tenantId = tenant.id
      }
      if (tenant.stateCode) {
        option.tenantCode = tenant.stateCode
      }

      return option
    })
    const totalStatesCount = states.length

    return {
      totalStatesCount,
      states,
    }
  },
}
