/**
 * Runtime configuration
 *
 * This module provides type-safe access to runtime configuration loaded from /config.js.
 * The config.js file is loaded before the app bundle and can be replaced at deployment time
 * without rebuilding the application.
 */

interface AppConfig {
  API_BASE_URL: string
  SINGLE_TENANT_MODE: boolean
  DEFAULT_AVERAGE_MEMBERS_PER_HOUSEHOLD?: string | number
  DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY?: string | number
  ANALYTICS_SCHEME_STATUS_CRITICAL_AFTER_DAYS?: number
  MAP_LEGEND_THRESHOLD_GTE_90?: string | number
  MAP_LEGEND_THRESHOLD_GTE_70?: string | number
  MAP_LEGEND_THRESHOLD_GTE_50?: string | number
  MAP_LEGEND_THRESHOLD_GTE_30?: string | number
  MAP_LEGEND_THRESHOLD_GTE_0?: string | number
  SHOW_SUPPLY_OUTAGE_CHARTS?: boolean
  SHOW_STAFF_OVERVIEW_SUPPLY_OUTAGE_CHARTS?: boolean
  SHOW_STAFF_OVERVIEW_NON_SUBMISSION_CHARTS?: boolean
  DEFAULT_DASHBOARD_DURATION?: {
    DAYS?: number
    ALLOWED_DAYS?: number[]
  }
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
    API_BASE_URL: (() => {
      const url = window.APP_CONFIG?.API_BASE_URL
      if (!url && typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('[Config] APP_CONFIG.API_BASE_URL is not set. API calls will fail.')
      }
      return url ?? ''
    })(),
    SINGLE_TENANT_MODE: window.APP_CONFIG?.SINGLE_TENANT_MODE ?? false,
    DEFAULT_AVERAGE_MEMBERS_PER_HOUSEHOLD: window.APP_CONFIG?.DEFAULT_AVERAGE_MEMBERS_PER_HOUSEHOLD,
    DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY:
      window.APP_CONFIG?.DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY,
    ANALYTICS_SCHEME_STATUS_CRITICAL_AFTER_DAYS:
      window.APP_CONFIG?.ANALYTICS_SCHEME_STATUS_CRITICAL_AFTER_DAYS,
    MAP_LEGEND_THRESHOLD_GTE_90: window.APP_CONFIG?.MAP_LEGEND_THRESHOLD_GTE_90,
    MAP_LEGEND_THRESHOLD_GTE_70: window.APP_CONFIG?.MAP_LEGEND_THRESHOLD_GTE_70,
    MAP_LEGEND_THRESHOLD_GTE_50: window.APP_CONFIG?.MAP_LEGEND_THRESHOLD_GTE_50,
    MAP_LEGEND_THRESHOLD_GTE_30: window.APP_CONFIG?.MAP_LEGEND_THRESHOLD_GTE_30,
    MAP_LEGEND_THRESHOLD_GTE_0: window.APP_CONFIG?.MAP_LEGEND_THRESHOLD_GTE_0,
    SHOW_SUPPLY_OUTAGE_CHARTS: window.APP_CONFIG?.SHOW_SUPPLY_OUTAGE_CHARTS ?? false,
    SHOW_STAFF_OVERVIEW_SUPPLY_OUTAGE_CHARTS:
      window.APP_CONFIG?.SHOW_STAFF_OVERVIEW_SUPPLY_OUTAGE_CHARTS ?? false,
    SHOW_STAFF_OVERVIEW_NON_SUBMISSION_CHARTS:
      window.APP_CONFIG?.SHOW_STAFF_OVERVIEW_NON_SUBMISSION_CHARTS ?? false,
    DEFAULT_DASHBOARD_DURATION: {
      DAYS: window.APP_CONFIG?.DEFAULT_DASHBOARD_DURATION?.DAYS ?? 1,
      ALLOWED_DAYS: window.APP_CONFIG?.DEFAULT_DASHBOARD_DURATION?.ALLOWED_DAYS ?? [1, 7, 30],
    },
  }
}

/**
 * Get the API base URL from runtime configuration
 * @returns API base URL string
 */
export const getApiBaseUrl = (): string => {
  return getRuntimeConfig().API_BASE_URL
}
