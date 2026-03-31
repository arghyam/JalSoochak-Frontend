import type { TenantChildLocation } from '../api/dashboard-api'

export type LocationTitleLookup = {
  idLookup: Record<number, string>
  lgdLookup: Record<number, string>
}

export const createLocationTitleLookup = (): LocationTitleLookup => ({
  idLookup: {},
  lgdLookup: {},
})

export const addLocationTitleToLookup = (
  lookup: LocationTitleLookup,
  location: TenantChildLocation,
  title: string
) => {
  if (!title) {
    return
  }

  if (typeof location.id === 'number' && Number.isFinite(location.id)) {
    lookup.idLookup[location.id] = title
  }

  if (typeof location.lgdCode === 'number' && Number.isFinite(location.lgdCode)) {
    lookup.lgdLookup[location.lgdCode] = title
  }
}

export const getLocationTitleFromLookup = (
  lookup: LocationTitleLookup | undefined,
  key: number | null | undefined
) => {
  if (!lookup || typeof key !== 'number' || !Number.isFinite(key)) {
    return undefined
  }

  return lookup.lgdLookup[key] ?? lookup.idLookup[key]
}
