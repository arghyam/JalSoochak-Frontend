import type {
  AverageSchemeRegularityResponse,
  AverageWaterSupplyPerRegionResponse,
  DashboardData,
  GeoJsonGeometry,
  NationalDashboardBoundaryResponse,
  NationalDashboardResponse,
  PumpOperatorDetailsResponse,
  TenantBoundaryGeoJsonResponse,
  TenantBoundaryResponse,
  WaterQuantityRegionWiseResponse,
} from '../../../types'
import type {
  TenantListContainer,
  TenantListItem,
  TenantListResponse,
  TenantPublicDateFormatConfig,
} from '../dashboard-api'

export type RawPumpOperatorDetailsResponse = Omit<PumpOperatorDetailsResponse, 'data'> & {
  data: Omit<PumpOperatorDetailsResponse['data'], 'missedSubmissionDays'> & {
    missedSubmissionDays: number | string[] | null
  }
}

export type RawNationalDashboardPayload = {
  success?: boolean
  data?: NationalDashboardResponse
}

export type RawNationalDashboardBoundaryPayload = {
  success?: boolean
  data?: NationalDashboardBoundaryResponse
}

export type RawAverageWaterSupplyPerRegionPayload = {
  success?: boolean
  data?: AverageWaterSupplyPerRegionResponse
}

export type WrappedAnalyticsResponse<T> = {
  success?: boolean
  data?: T
}

export type ApiEnvelope<T> = {
  data: T
}

export type TenantPublicConfigMap = {
  DATE_FORMAT_SCREEN?: TenantPublicDateFormatConfig
  DATE_FORMAT_TABLE?: TenantPublicDateFormatConfig
  AVERAGE_MEMBERS_PER_HOUSEHOLD?: { value?: string | null }
  WATER_NORM?: { value?: string | null }
  DISPLAY_DEPARTMENT_MAP?: { value?: string | null }
  DISPLAY_DEPARTMENT_MAP_LEVEL_1?: { value?: string | null }
  DISPLAY_DEPARTMENT_MAP_LEVEL_2?: { value?: string | null }
  DISPLAY_DEPARTMENT_MAP_LEVEL_3?: { value?: string | null }
  DISPLAY_DEPARTMENT_MAP_LEVEL_4?: { value?: string | null }
  DISPLAY_DEPARTMENT_MAP_LEVEL_5?: { value?: string | null }
  DISPLAY_DEPARTMENT_MAP_LEVEL_6?: { value?: string | null }
  DISPLAY_MAP_LGD_LEVEL_1?: { value?: string | null }
  DISPLAY_MAP_LGD_LEVEL_2?: { value?: string | null }
  DISPLAY_MAP_LGD_LEVEL_3?: { value?: string | null }
  DISPLAY_MAP_LGD_LEVEL_4?: { value?: string | null }
  DISPLAY_MAP_LGD_LEVEL_5?: { value?: string | null }
  DISPLAY_MAP_LGD_LEVEL_6?: { value?: string | null }
}

const DEPARTMENT_MAP_LEVEL_KEYS = [
  'DISPLAY_DEPARTMENT_MAP_LEVEL_1',
  'DISPLAY_DEPARTMENT_MAP_LEVEL_2',
  'DISPLAY_DEPARTMENT_MAP_LEVEL_3',
  'DISPLAY_DEPARTMENT_MAP_LEVEL_4',
  'DISPLAY_DEPARTMENT_MAP_LEVEL_5',
  'DISPLAY_DEPARTMENT_MAP_LEVEL_6',
] as const

const LGD_MAP_LEVEL_KEYS = [
  'DISPLAY_MAP_LGD_LEVEL_1',
  'DISPLAY_MAP_LGD_LEVEL_2',
  'DISPLAY_MAP_LGD_LEVEL_3',
  'DISPLAY_MAP_LGD_LEVEL_4',
  'DISPLAY_MAP_LGD_LEVEL_5',
  'DISPLAY_MAP_LGD_LEVEL_6',
] as const

export const readBooleanConfigValue = (
  value: string | null | undefined,
  fallback: boolean
): boolean => {
  if (typeof value !== 'string') {
    return fallback
  }
  if (value === 'TRUE' || value === 'YES') {
    return true
  }
  if (value === 'FALSE' || value === 'NO') {
    return false
  }
  return fallback
}

export const readDepartmentMapLevelsWithCascade = (configs: TenantPublicConfigMap): boolean[] => {
  const levels = DEPARTMENT_MAP_LEVEL_KEYS.map((key) => {
    const entry = configs[key]
    return readBooleanConfigValue(entry?.value, true)
  })

  for (let index = 1; index < levels.length; index += 1) {
    if (!levels[index - 1]) {
      levels[index] = false
    }
  }

  return levels
}

export const readLgdMapLevelsWithCascade = (configs: TenantPublicConfigMap): boolean[] => {
  const levels = LGD_MAP_LEVEL_KEYS.map((key) => {
    const entry = configs[key]
    return readBooleanConfigValue(entry?.value, true)
  })

  for (let index = 1; index < levels.length; index += 1) {
    if (!levels[index - 1]) {
      levels[index] = false
    }
  }

  return levels
}

type TenantBoundaryChildRegionAlias = {
  childLgdId?: number
  childLgdTitle?: string
  lgdId?: number
  childDepartmentId?: number
  childDepartmentTitle?: string
  departmentId?: number
  title?: string
  boundaryGeoJson?: unknown
}

type TenantBoundaryGeoJsonChildRegionAlias = {
  boundaryGeoJson?: unknown
}

type AnalyticsChildRegionAlias = {
  lgdId?: number
  departmentId?: number
  title?: string
  childLgdId?: number
  childDepartmentId?: number
  childLgdTitle?: string
  childDepartmentTitle?: string
}

const parseBoundaryGeoJson = (value: unknown, context: string) => {
  if (value == null) {
    return null
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      throw new Error(`Invalid ${context} response: boundary GeoJSON is not valid JSON`)
    }
  }

  return value && typeof value === 'object' ? value : null
}

const isGeoJsonGeometry = (value: unknown): value is GeoJsonGeometry =>
  Boolean(value) &&
  typeof value === 'object' &&
  typeof (value as { type?: unknown }).type === 'string'

const normalizeGeoJsonGeometry = (value: unknown): GeoJsonGeometry | null => {
  const candidate = (() => {
    if (typeof value !== 'string') {
      return value
    }

    try {
      return JSON.parse(value) as unknown
    } catch {
      return null
    }
  })()

  return isGeoJsonGeometry(candidate) ? candidate : null
}

export const normalizeMissedSubmissionDays = (
  value: RawPumpOperatorDetailsResponse['data']['missedSubmissionDays']
) => {
  if (Array.isArray(value)) {
    return value.length
  }

  return typeof value === 'number' ? value : null
}

export const normalizeNationalDashboardResponse = (
  response: NationalDashboardResponse | RawNationalDashboardPayload
): NationalDashboardResponse => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid national dashboard response: expected an object payload')
  }

  if ('stateWiseQuantityPerformance' in response) {
    return response
  }

  const payload = response.data
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid national dashboard response: missing data payload')
  }

  if (!('stateWiseQuantityPerformance' in payload)) {
    throw new Error(
      'Invalid national dashboard response: data payload is missing stateWiseQuantityPerformance'
    )
  }

  return payload
}

const normalizeStateWiseBoundaries = (
  stateWiseBoundaries: unknown
): NationalDashboardBoundaryResponse['stateWiseBoundaries'] => {
  if (!Array.isArray(stateWiseBoundaries)) {
    return []
  }

  return stateWiseBoundaries.flatMap((boundary) => {
    if (!boundary || typeof boundary !== 'object') {
      return []
    }

    return {
      ...boundary,
      boundary: normalizeGeoJsonGeometry(boundary.boundary),
    }
  })
}

export const normalizeNationalDashboardBoundaryResponse = (
  response: NationalDashboardBoundaryResponse | RawNationalDashboardBoundaryPayload
): NationalDashboardBoundaryResponse => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid national dashboard boundary response: expected an object payload')
  }

  if ('stateWiseBoundaries' in response) {
    return {
      nationalBoundary: normalizeGeoJsonGeometry(response.nationalBoundary),
      stateWiseBoundaries: normalizeStateWiseBoundaries(response.stateWiseBoundaries),
    }
  }

  const payload = response.data
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid national dashboard boundary response: missing data payload')
  }

  if (!('stateWiseBoundaries' in payload)) {
    throw new Error(
      'Invalid national dashboard boundary response: data payload is missing stateWiseBoundaries'
    )
  }

  return {
    nationalBoundary: normalizeGeoJsonGeometry(payload.nationalBoundary),
    stateWiseBoundaries: normalizeStateWiseBoundaries(payload.stateWiseBoundaries),
  }
}

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

export const resolveTenantListContainer = (
  value: TenantListResponse | undefined
): TenantListContainer => {
  if (!value) {
    return {}
  }

  const firstLevel = toTenantListContainer(value)
  const secondLevel =
    value.data && typeof value.data === 'object'
      ? toTenantListContainer((value.data as { data?: unknown }).data)
      : null
  const dataLevel = toTenantListContainer(value.data)

  return secondLevel ?? dataLevel ?? firstLevel ?? {}
}

export const unwrapAnalyticsResponse = <T>(
  response: T | WrappedAnalyticsResponse<T>,
  context: string
): T | undefined => {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as WrappedAnalyticsResponse<T>).data
    if (data == null) {
      throw new Error(`Invalid ${context} response: wrapped payload is missing data`)
    }

    return data
  }

  return response as T
}

const normalizeAnalyticsChildRegion = <T extends AnalyticsChildRegionAlias>(region: T): T => ({
  ...region,
  lgdId: region.lgdId !== undefined ? region.lgdId : (region.childLgdId ?? 0),
  departmentId:
    region.departmentId !== undefined ? region.departmentId : (region.childDepartmentId ?? 0),
  title:
    region.title !== undefined
      ? region.title
      : (region.childDepartmentTitle ?? region.childLgdTitle ?? ''),
})

export const normalizeAverageWaterSupplyResponse = (
  response: AverageWaterSupplyPerRegionResponse
): AverageWaterSupplyPerRegionResponse => ({
  ...response,
  childRegions: Array.isArray(response.childRegions)
    ? response.childRegions.map((region) => normalizeAnalyticsChildRegion(region))
    : [],
})

export const normalizeAverageSchemeRegularityResponse = (
  response: AverageSchemeRegularityResponse
): AverageSchemeRegularityResponse => ({
  ...response,
  childRegions: Array.isArray(response.childRegions)
    ? response.childRegions.map((region) => normalizeAnalyticsChildRegion(region))
    : [],
})

export const normalizeWaterQuantityRegionWiseResponse = (
  response: WaterQuantityRegionWiseResponse
): WaterQuantityRegionWiseResponse => ({
  ...response,
  childRegions: Array.isArray(response.childRegions)
    ? response.childRegions.map((region) => normalizeAnalyticsChildRegion(region))
    : [],
})

const normalizeTenantBoundaryChildRegion = <T extends TenantBoundaryChildRegionAlias>(
  region: T
) => ({
  ...region,
  childLgdId: region.childLgdId ?? region.lgdId,
  childDepartmentId: region.childDepartmentId ?? region.departmentId ?? undefined,
  childLgdTitle: region.childLgdTitle ?? region.title ?? region.childDepartmentTitle ?? '',
  title: region.title ?? region.childDepartmentTitle ?? region.childLgdTitle ?? '',
})

export const normalizeTenantBoundaryResponse = (
  response: TenantBoundaryResponse
): TenantBoundaryResponse => ({
  ...response,
  childRegions: Array.isArray(response.childRegions)
    ? response.childRegions.map((region) => normalizeTenantBoundaryChildRegion(region))
    : [],
})

const normalizeTenantBoundaryGeoJsonChildRegion = <T extends TenantBoundaryGeoJsonChildRegionAlias>(
  region: T,
  context: string
) => ({
  ...region,
  parsedBoundaryGeoJson: (() => {
    const parsed = parseBoundaryGeoJson(region.boundaryGeoJson, `${context} child region`)
    return isGeoJsonGeometry(parsed) ? parsed : null
  })(),
})

export const normalizeTenantBoundaryGeoJsonResponse = (
  response: TenantBoundaryGeoJsonResponse,
  context = 'tenant boundary geojson analytics'
): TenantBoundaryGeoJsonResponse => ({
  ...response,
  parsedParentBoundaryGeoJson: (() => {
    const parsed = parseBoundaryGeoJson(response.parentBoundaryGeoJson, context)
    return isGeoJsonGeometry(parsed) ? parsed : null
  })(),
  childRegions: Array.isArray(response.childRegions)
    ? response.childRegions.map((region) =>
        normalizeTenantBoundaryGeoJsonChildRegion(region, context)
      )
    : [],
})

export const isDashboardDataPayload = (value: unknown): value is DashboardData => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<DashboardData>
  const kpis = candidate.kpis as Partial<DashboardData['kpis']> | undefined
  const hasValidKpis =
    !!kpis &&
    typeof kpis === 'object' &&
    Number.isFinite(kpis.totalSchemes) &&
    Number.isFinite(kpis.totalRuralHouseholds) &&
    Number.isFinite(kpis.functionalTapConnections)
  const hasValidReadingCompliance =
    Array.isArray(candidate.readingCompliance) ||
    ((candidate.level === 'block' || candidate.level === 'gram-panchayat') &&
      candidate.readingCompliance == null)

  return (
    hasValidKpis &&
    Array.isArray(candidate.mapData) &&
    Array.isArray(candidate.demandSupply) &&
    Array.isArray(candidate.readingSubmissionStatus) &&
    hasValidReadingCompliance &&
    Array.isArray(candidate.pumpOperators) &&
    Array.isArray(candidate.waterSupplyOutages) &&
    Array.isArray(candidate.topPerformers) &&
    Array.isArray(candidate.worstPerformers) &&
    Array.isArray(candidate.regularityData) &&
    Array.isArray(candidate.continuityData)
  )
}

export const normalizeDashboardData = (data: DashboardData): DashboardData => ({
  ...data,
  readingCompliance: data.readingCompliance ?? [],
})
