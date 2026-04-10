/**
 * Map Registry Utility
 *
 * This file is used to register GeoJSON maps with ECharts.
 */

import * as echarts from 'echarts'

export const INDIA_NATIONAL_BOUNDARY_FEATURE_NAME = '__india_national_boundary__'
export const PARENT_BOUNDARY_FEATURE_NAME = '__parent_boundary__'

export interface EChartsMapFeatureCollection {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    id?: string | number
    properties: {
      name: string
      cp?: [number, number]
      [key: string]: unknown
    }
    geometry: unknown
  }>
}

type GeoJsonGeometry = {
  type?: string
  coordinates?: unknown
  geometries?: GeoJsonGeometry[]
}

type Position = [number, number]

const isPosition = (value: unknown): value is Position =>
  Array.isArray(value) &&
  value.length >= 2 &&
  typeof value[0] === 'number' &&
  Number.isFinite(value[0]) &&
  typeof value[1] === 'number' &&
  Number.isFinite(value[1])

const getRingArea = (ring: Position[]) => {
  if (ring.length < 3) {
    return 0
  }

  let area = 0
  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index]
    const [x2, y2] = ring[(index + 1) % ring.length]
    area += x1 * y2 - x2 * y1
  }

  return area / 2
}

const getRingCentroid = (ring: Position[]): Position | null => {
  const area = getRingArea(ring)
  if (Math.abs(area) < Number.EPSILON) {
    return null
  }

  let centroidX = 0
  let centroidY = 0
  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index]
    const [x2, y2] = ring[(index + 1) % ring.length]
    const factor = x1 * y2 - x2 * y1
    centroidX += (x1 + x2) * factor
    centroidY += (y1 + y2) * factor
  }

  const divisor = 6 * area
  if (Math.abs(divisor) < Number.EPSILON) {
    return null
  }

  return [centroidX / divisor, centroidY / divisor]
}

const getRingBoundsCenter = (ring: Position[]): Position | null => {
  if (!ring.length) {
    return null
  }

  const xs = ring.map((point) => point[0])
  const ys = ring.map((point) => point[1])
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
}

const getPolygonAnchor = (polygon: unknown): { center: Position; area: number } | null => {
  if (!Array.isArray(polygon) || polygon.length === 0) {
    return null
  }

  const outerRing = polygon[0]
  if (!Array.isArray(outerRing)) {
    return null
  }

  const normalizedRing = outerRing.filter(isPosition)
  if (normalizedRing.length < 3) {
    return null
  }

  const area = Math.abs(getRingArea(normalizedRing))
  const center = getRingCentroid(normalizedRing) ?? getRingBoundsCenter(normalizedRing)
  if (!center) {
    return null
  }

  return { center, area }
}

const getGeometryCenter = (geometry: unknown): Position | null => {
  if (!geometry || typeof geometry !== 'object') {
    return null
  }

  const typedGeometry = geometry as GeoJsonGeometry

  if (typedGeometry.type === 'Polygon') {
    return getPolygonAnchor(typedGeometry.coordinates)?.center ?? null
  }

  if (typedGeometry.type === 'MultiPolygon' && Array.isArray(typedGeometry.coordinates)) {
    const anchor = typedGeometry.coordinates
      .map((polygon) => getPolygonAnchor(polygon))
      .filter((value): value is { center: Position; area: number } => value != null)
      .sort((left, right) => right.area - left.area)[0]

    return anchor?.center ?? null
  }

  if (typedGeometry.type === 'GeometryCollection' && Array.isArray(typedGeometry.geometries)) {
    for (const childGeometry of typedGeometry.geometries) {
      const center = getGeometryCenter(childGeometry)
      if (center) {
        return center
      }
    }
  }

  return null
}

export function registerDynamicMap(mapName: string, geoJsonData: EChartsMapFeatureCollection) {
  echarts.registerMap(mapName, geoJsonData as Parameters<typeof echarts.registerMap>[1])
}

export function buildFeatureCollectionFromRegions(
  regions: Array<{
    id: string
    name: string
    boundaryGeoJson?: unknown
  }>,
  options?: {
    nationalBoundaryGeoJson?: unknown
    parentBoundaryGeoJson?: unknown
  }
): EChartsMapFeatureCollection | null {
  const features = [
    ...(options?.nationalBoundaryGeoJson && typeof options.nationalBoundaryGeoJson === 'object'
      ? [
          {
            type: 'Feature' as const,
            id: INDIA_NATIONAL_BOUNDARY_FEATURE_NAME,
            properties: {
              name: INDIA_NATIONAL_BOUNDARY_FEATURE_NAME,
            },
            geometry: options.nationalBoundaryGeoJson,
          },
        ]
      : []),
    ...(options?.parentBoundaryGeoJson && typeof options.parentBoundaryGeoJson === 'object'
      ? [
          {
            type: 'Feature' as const,
            id: PARENT_BOUNDARY_FEATURE_NAME,
            properties: {
              name: PARENT_BOUNDARY_FEATURE_NAME,
            },
            geometry: options.parentBoundaryGeoJson,
          },
        ]
      : []),
    ...regions.flatMap((region) => {
      if (!region.boundaryGeoJson || typeof region.boundaryGeoJson !== 'object') {
        return []
      }

      const geometryCenter = getGeometryCenter(region.boundaryGeoJson)

      return [
        {
          type: 'Feature' as const,
          id: region.id,
          properties: {
            name: region.name,
            regionId: region.id,
            ...(geometryCenter ? { cp: geometryCenter } : {}),
          },
          geometry: region.boundaryGeoJson,
        },
      ]
    }),
  ]

  if (!features.length) {
    return null
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}
