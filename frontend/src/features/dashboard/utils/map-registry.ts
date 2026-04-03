/**
 * Map Registry Utility
 *
 * This file is used to register GeoJSON maps with ECharts.
 */

import * as echarts from 'echarts'

let indiaMapRegistrationPromise: Promise<void> | null = null

export interface EChartsMapFeatureCollection {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    id?: string | number
    properties: {
      name: string
      [key: string]: unknown
    }
    geometry: unknown
  }>
}

/**
 * Register map GeoJSON with ECharts
 * Call this function once when the app loads (e.g., in main.tsx or App.tsx)
 *
 * @param geoJsonData - GeoJSON data
 */
export function registerIndiaMap(geoJsonData: unknown) {
  echarts.registerMap('india', geoJsonData as Parameters<typeof echarts.registerMap>[1])
}

/**
 * Check if registered
 */
export function isIndiaMapRegistered(): boolean {
  return echarts.getMap('india') != null
}

export async function ensureIndiaMapRegistered() {
  if (isIndiaMapRegistered()) {
    return
  }

  if (!indiaMapRegistrationPromise) {
    indiaMapRegistrationPromise = import('@/assets/data/geojson/india.geojson?raw')
      .then(({ default: indiaGeoJsonRaw }) => {
        const indiaGeoJson = JSON.parse(indiaGeoJsonRaw) as unknown
        registerIndiaMap(indiaGeoJson)
      })
      .finally(() => {
        indiaMapRegistrationPromise = null
      })
  }

  await indiaMapRegistrationPromise
}

export function registerDynamicMap(mapName: string, geoJsonData: EChartsMapFeatureCollection) {
  echarts.registerMap(mapName, geoJsonData as Parameters<typeof echarts.registerMap>[1])
}

export function buildFeatureCollectionFromRegions(
  regions: Array<{
    id: string
    name: string
    boundaryGeoJson?: unknown
  }>
): EChartsMapFeatureCollection | null {
  const features = regions.flatMap((region) => {
    if (!region.boundaryGeoJson || typeof region.boundaryGeoJson !== 'object') {
      return []
    }

    return [
      {
        type: 'Feature' as const,
        id: region.id,
        properties: {
          name: region.name,
          regionId: region.id,
        },
        geometry: region.boundaryGeoJson,
      },
    ]
  })

  if (!features.length) {
    return null
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}
