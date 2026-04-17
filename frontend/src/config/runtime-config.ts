/**
 * Runtime configuration
 *
 * This module provides type-safe access to runtime configuration loaded from /config.js.
 * The config.js file is loaded before the app bundle and can be replaced at deployment time
 * without rebuilding the application.
 */

interface AppConfig {
  API_BASE_URL: string
  JALSOOCHAK_SERVER_MODE?: string
  JALSOOCHAK_TENANT_ID?: string | number
  DEFAULT_AVERAGE_MEMBERS_PER_HOUSEHOLD?: string | number
  DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY?: string | number
  MAP_LEGEND_THRESHOLD_GTE_90?: string | number
  MAP_LEGEND_THRESHOLD_GTE_70?: string | number
  MAP_LEGEND_THRESHOLD_GTE_50?: string | number
  MAP_LEGEND_THRESHOLD_GTE_30?: string | number
  MAP_LEGEND_THRESHOLD_GTE_0?: string | number
}

// Extend Window interface to include APP_CONFIG
declare global {
  interface Window {
    APP_CONFIG?: AppConfig
  }
}

/**
 * Get runtime configuration with fallback values
 * @returns Runtime configuration object
 */
export const getRuntimeConfig = (): AppConfig => {
  return {
    API_BASE_URL: window.APP_CONFIG?.API_BASE_URL || 'https://jalsoochak.beehyv.com',
    JALSOOCHAK_SERVER_MODE: window.APP_CONFIG?.JALSOOCHAK_SERVER_MODE,
    JALSOOCHAK_TENANT_ID: window.APP_CONFIG?.JALSOOCHAK_TENANT_ID,
    DEFAULT_AVERAGE_MEMBERS_PER_HOUSEHOLD: window.APP_CONFIG?.DEFAULT_AVERAGE_MEMBERS_PER_HOUSEHOLD,
    DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY:
      window.APP_CONFIG?.DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY,
    MAP_LEGEND_THRESHOLD_GTE_90: window.APP_CONFIG?.MAP_LEGEND_THRESHOLD_GTE_90,
    MAP_LEGEND_THRESHOLD_GTE_70: window.APP_CONFIG?.MAP_LEGEND_THRESHOLD_GTE_70,
    MAP_LEGEND_THRESHOLD_GTE_50: window.APP_CONFIG?.MAP_LEGEND_THRESHOLD_GTE_50,
    MAP_LEGEND_THRESHOLD_GTE_30: window.APP_CONFIG?.MAP_LEGEND_THRESHOLD_GTE_30,
    MAP_LEGEND_THRESHOLD_GTE_0: window.APP_CONFIG?.MAP_LEGEND_THRESHOLD_GTE_0,
  }
}

/**
 * Get the API base URL from runtime configuration
 * @returns API base URL string
 */
export const getApiBaseUrl = (): string => {
  return getRuntimeConfig().API_BASE_URL
}
