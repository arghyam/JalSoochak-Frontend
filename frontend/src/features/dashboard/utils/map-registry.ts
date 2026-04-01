/**
 * Map Registry Utility
 *
 * This file is used to register GeoJSON maps with ECharts.
 */

import * as echarts from 'echarts'

let indiaMapRegistrationPromise: Promise<void> | null = null

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
  const map = echarts.getMap('india')
  return Boolean(map && map.geoJson)
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
