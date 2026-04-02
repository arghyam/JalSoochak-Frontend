const STABLE_LOCATION_VALUE_SEPARATOR = ':'

type StableLocationSegments = {
  locationIdSegment?: string
  secondarySegment?: string
  lastSegment?: string
}

export const toStableLocationValue = (
  locationId: number,
  analyticsId: number | undefined,
  slug: string
): string =>
  `${locationId}${STABLE_LOCATION_VALUE_SEPARATOR}${analyticsId ?? locationId}${STABLE_LOCATION_VALUE_SEPARATOR}${slug}`

export const parseStableLocationValue = (value: string): StableLocationSegments => {
  if (!value) {
    return {}
  }

  const segments = value.split(STABLE_LOCATION_VALUE_SEPARATOR)
  return {
    locationIdSegment: segments[0],
    secondarySegment: segments[1],
    lastSegment: segments[segments.length - 1],
  }
}
