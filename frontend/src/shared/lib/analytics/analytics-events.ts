/**
 * GA4 event schema.
 *
 * This module is the single declaration of what the dashboard reports to Firebase Analytics.
 * The level/hierarchy unions below are the analytics vocabulary rather than domain types —
 * `features/dashboard/utils/dashboard-level.ts` derives its domain types from them so the
 * dependency direction stays features -> shared.
 */

import type { LanguageCode } from '@/app/i18n'

/** Administrative (LGD) drilldown levels, shallowest first. */
export type AdministrativeLevel = 'district' | 'block' | 'gramPanchayat' | 'village'

/** Departmental drilldown levels, shallowest first. */
export type DepartmentalLevel =
  | 'departmentZone'
  | 'departmentCircle'
  | 'departmentDivision'
  | 'departmentSubdivision'
  | 'departmentVillage'

/**
 * Every level a dashboard view can sit at.
 *
 * `national` is the multi-tenant landing view; `state` is where single-tenant deployments
 * start. Everything below is reached via search params.
 */
export type DashboardLevel = 'national' | 'state' | AdministrativeLevel | DepartmentalLevel

/**
 * Which hierarchy the view is drilling through.
 *
 * Note the URL only ever carries `tab=administrative`; the departmental hierarchy is encoded
 * as the *absence* of that param, so this is inferred rather than read directly.
 */
export type DashboardHierarchy = 'administrative' | 'departmental'

/** Whether the deployment starts at the national view or is pinned to one state. */
export type TenancyMode = 'single' | 'multi'

/** How the user got to a new level. */
export type DrilldownSource = 'filter' | 'breadcrumb' | 'map' | 'table' | 'clear'

/** Which footer social channel was opened. */
export type SocialNetwork = 'x' | 'linkedin' | 'email'

/**
 * Parameters carried by each event.
 *
 * Keys are snake_case because that is what GA4 reports on. Optional params are dropped
 * before sending rather than sent as empty strings.
 */
export interface AnalyticsEventParamMap {
  /**
   * A dashboard view at a given hierarchy level.
   *
   * Administrative vs departmental totals are this event sliced by `hierarchy`, so no
   * separate per-hierarchy events are needed.
   */
  dashboard_level_view: {
    level: DashboardLevel
    hierarchy: DashboardHierarchy
    /** 0 = national, 1 = state, 2..6 = successively deeper. */
    depth: number
    tenancy: TenancyMode
    state?: string
    district_name?: string
    block_name?: string
    gram_panchayat_name?: string
    village_name?: string
    zone_name?: string
    circle_name?: string
    division_name?: string
    subdivision_name?: string
    department_village_name?: string
  }
  /** A level transition, attributed to whichever control triggered it. */
  drilldown: {
    from_level: DashboardLevel
    to_level: DashboardLevel
    hierarchy: DashboardHierarchy
    source: DrilldownSource
  }
  filter_tab_switch: {
    from: DashboardHierarchy
    to: DashboardHierarchy
  }
  language_change: {
    from: LanguageCode
    to: LanguageCode
  }
  social_link_click: {
    network: SocialNetwork
    tenancy: TenancyMode
  }
  quick_link_click: {
    /** Stable key for the link, not its translated label. */
    link: string
    external: boolean
  }
  duration_change: {
    days: number
    preset_id?: string
    is_custom: boolean
  }
  export_data: {
    level: DashboardLevel
    hierarchy: DashboardHierarchy
    format: 'csv'
  }
  /**
   * A location search, debounced to the settled term rather than per keystroke.
   *
   * No result count: the matching happens inside the search layout after this fires, so any
   * count available here would lag the term by a keystroke.
   */
  location_search: {
    /**
     * Length of the settled term, never the term itself. The search box is free text a
     * visitor can type anything into — a name, a phone number, an address — so the content
     * must not leave the browser.
     */
    search_term_length: number
    /** The level the user was searching from, not the level searched for. */
    level: DashboardLevel
    hierarchy: DashboardHierarchy
  }
}

export type AnalyticsEventName = keyof AnalyticsEventParamMap

/** User-scoped properties, applied to every subsequent event. */
export interface AnalyticsUserProperties {
  language?: string
  tenancy?: TenancyMode
}
