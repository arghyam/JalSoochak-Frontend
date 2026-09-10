/**
 * Scheme status vocabulary, shared by the public dashboards (analytics-service) and the State Admin
 * panel (scheme-service).
 *
 * Both services report the same two dimensions — work status and operating status — using the same
 * wire shapes. The numeric `code` is the identity: it is what colours, i18n keys and derived counts
 * key off, which is what makes the labels translatable.
 *
 * IMPORTANT: `label` here is the canonical English label. It is the wire contract — it is the value
 * scheme rows carry, the value the scheme-list filters send, and the value
 * `PATCH /schemes/{id}/status` accepts. The `en` values under `schemeStatus.*` in `common.json`
 * must stay byte-identical to these strings.
 */

/** `null` means the source system has no status recorded for the scheme. */
export type SchemeStatusCode = number | null

/** A status as reported by either service. */
export interface SchemeStatus {
  code: SchemeStatusCode
  label: string
}

/** One bucket of a status breakdown. Identical shape in both services. */
export interface SchemeStatusCount extends SchemeStatus {
  count: number
}

export type SchemeStatusDimension = 'workStatus' | 'operatingStatus'

export const WORK_STATUS_CODES = {
  ONGOING: 1,
  COMPLETED: 2,
  NOT_STARTED: 3,
  HANDED_OVER: 4,
} as const

export const OPERATING_STATUS_CODES = {
  NON_OPERATIVE: 0,
  OPERATIVE: 1,
  PARTIALLY_OPERATIVE: 2,
} as const

export type WorkStatusCode = (typeof WORK_STATUS_CODES)[keyof typeof WORK_STATUS_CODES]
export type OperatingStatusCode =
  (typeof OPERATING_STATUS_CODES)[keyof typeof OPERATING_STATUS_CODES]

/** Chakra tokens for a badge or chip. */
export interface SchemeStatusColors {
  bg: string
  color: string
}

export interface SchemeStatusDescriptor {
  code: number
  /** Canonical English label — see the file header; this is the wire contract. */
  label: string
  /** Namespace-qualified key so it resolves from any `useTranslation(...)` instance. */
  i18nKey: string
  colors: SchemeStatusColors
  /** Chakra token for a chart slice; resolved to hex at render via `resolveThemeColorToken`. */
  chartColorToken: string
}

export const UNKNOWN_SCHEME_STATUS_I18N_KEY = 'common:schemeStatus.unknown'

export const DEFAULT_SCHEME_STATUS_COLORS: SchemeStatusColors = {
  bg: 'neutral.100',
  color: 'neutral.600',
}

export const UNKNOWN_SCHEME_STATUS_CHART_COLOR_TOKEN = 'neutral.300'

/**
 * Display order — deliberately NOT code order.
 *
 * These arrays reproduce the pre-migration `WORK_STATUS_OPTIONS` / `OPERATING_STATUS_OPTIONS`
 * ordering exactly, so filter dropdowns and chip menus keep their existing lifecycle order.
 * Use `getSchemeStatusCodeOrder` for charts and legends, which must follow the wire contract
 * (ascending by code).
 */
const WORK_STATUS_DESCRIPTORS: readonly SchemeStatusDescriptor[] = [
  {
    code: WORK_STATUS_CODES.NOT_STARTED,
    label: 'Not Started',
    i18nKey: 'common:schemeStatus.work.notStarted',
    colors: { bg: 'neutral.100', color: 'neutral.600' },
    chartColorToken: 'neutral.600',
  },
  {
    code: WORK_STATUS_CODES.ONGOING,
    label: 'Ongoing',
    i18nKey: 'common:schemeStatus.work.ongoing',
    colors: { bg: 'warning.50', color: 'warning.600' },
    chartColorToken: 'warning.500',
  },
  {
    code: WORK_STATUS_CODES.COMPLETED,
    label: 'Completed',
    i18nKey: 'common:schemeStatus.work.completed',
    colors: { bg: 'success.50', color: 'success.500' },
    chartColorToken: 'success.500',
  },
  {
    code: WORK_STATUS_CODES.HANDED_OVER,
    label: 'Handed Over',
    i18nKey: 'common:schemeStatus.work.handedOver',
    colors: { bg: 'primary.50', color: 'primary.600' },
    chartColorToken: 'primary.500',
  },
]

const OPERATING_STATUS_DESCRIPTORS: readonly SchemeStatusDescriptor[] = [
  {
    code: OPERATING_STATUS_CODES.NON_OPERATIVE,
    label: 'Non-Operative',
    i18nKey: 'common:schemeStatus.operating.nonOperative',
    colors: { bg: 'error.50', color: 'error.500' },
    chartColorToken: 'error.500',
  },
  {
    code: OPERATING_STATUS_CODES.PARTIALLY_OPERATIVE,
    label: 'Partially Operative',
    i18nKey: 'common:schemeStatus.operating.partiallyOperative',
    colors: { bg: 'warning.50', color: 'warning.600' },
    chartColorToken: 'warning.500',
  },
  {
    code: OPERATING_STATUS_CODES.OPERATIVE,
    label: 'Operative',
    i18nKey: 'common:schemeStatus.operating.operative',
    colors: { bg: 'success.50', color: 'success.500' },
    chartColorToken: 'success.500',
  },
]

/** Descriptors in UI order. Drives filter dropdowns and chip menus. */
export const SCHEME_STATUS_DESCRIPTORS: Record<
  SchemeStatusDimension,
  readonly SchemeStatusDescriptor[]
> = {
  workStatus: WORK_STATUS_DESCRIPTORS,
  operatingStatus: OPERATING_STATUS_DESCRIPTORS,
}

/** Codes in UI order. */
export const getSchemeStatusDisplayOrder = (dimension: SchemeStatusDimension): number[] =>
  SCHEME_STATUS_DESCRIPTORS[dimension].map((descriptor) => descriptor.code)

/** Codes ascending, matching the order both services sort their buckets in. */
export const getSchemeStatusCodeOrder = (dimension: SchemeStatusDimension): number[] =>
  getSchemeStatusDisplayOrder(dimension).sort((a, b) => a - b)

export function isWorkStatusCode(code: SchemeStatusCode | undefined): code is WorkStatusCode {
  return WORK_STATUS_DESCRIPTORS.some((descriptor) => descriptor.code === code)
}

export function isOperatingStatusCode(
  code: SchemeStatusCode | undefined
): code is OperatingStatusCode {
  return OPERATING_STATUS_DESCRIPTORS.some((descriptor) => descriptor.code === code)
}

/**
 * Folds case, hyphens, underscores and repeated whitespace so `NON_OPERATIVE`, `non-operative` and
 * `  Non Operative ` all match. Same normalization the legacy chart legend used.
 */
export const normalizeSchemeStatusLabel = (label: string): string =>
  label.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')

const DESCRIPTOR_BY_NORMALIZED_LABEL: Record<
  SchemeStatusDimension,
  Record<string, SchemeStatusDescriptor>
> = {
  workStatus: Object.fromEntries(
    WORK_STATUS_DESCRIPTORS.map((d) => [normalizeSchemeStatusLabel(d.label), d])
  ),
  operatingStatus: Object.fromEntries(
    OPERATING_STATUS_DESCRIPTORS.map((d) => [normalizeSchemeStatusLabel(d.label), d])
  ),
}

export function findSchemeStatusByCode(
  dimension: SchemeStatusDimension,
  code: SchemeStatusCode | undefined
): SchemeStatusDescriptor | undefined {
  if (typeof code !== 'number') return undefined
  return SCHEME_STATUS_DESCRIPTORS[dimension].find((descriptor) => descriptor.code === code)
}

/**
 * Reverse lookup, needed because scheme LIST rows carry only a label string — no code. Returns
 * `undefined` for an unrecognised label rather than guessing, so callers can fall back to
 * rendering the raw string.
 */
export function findSchemeStatusByLabel(
  dimension: SchemeStatusDimension,
  label: string | null | undefined
): SchemeStatusDescriptor | undefined {
  if (typeof label !== 'string') return undefined
  const normalized = normalizeSchemeStatusLabel(label)
  if (!normalized) return undefined
  return DESCRIPTOR_BY_NORMALIZED_LABEL[dimension][normalized]
}

/** Canonical English label for a code — the value to send on the wire. */
export function getSchemeStatusCanonicalLabel(
  dimension: SchemeStatusDimension,
  code: SchemeStatusCode | undefined
): string | undefined {
  return findSchemeStatusByCode(dimension, code)?.label
}

export function getSchemeStatusColors(
  dimension: SchemeStatusDimension,
  code: SchemeStatusCode | undefined
): SchemeStatusColors {
  return findSchemeStatusByCode(dimension, code)?.colors ?? DEFAULT_SCHEME_STATUS_COLORS
}

export function getSchemeStatusChartColorToken(
  dimension: SchemeStatusDimension,
  code: SchemeStatusCode | undefined
): string {
  return (
    findSchemeStatusByCode(dimension, code)?.chartColorToken ??
    UNKNOWN_SCHEME_STATUS_CHART_COLOR_TOKEN
  )
}

/**
 * Minimal shape of i18next's `t`. Declared locally rather than importing `TFunction` so one helper
 * serves every namespace — the keys above are namespace-qualified, so any `t` resolves them.
 */
export type SchemeStatusTranslate = (key: string, options?: { defaultValue?: string }) => string

/**
 * Resolves a display label, preferring the numeric code and falling back through the reverse label
 * map. An unrecognised, non-empty label is returned verbatim rather than blanked, so a future
 * backend status still reads sensibly.
 */
export function resolveSchemeStatusLabel(
  t: SchemeStatusTranslate,
  dimension: SchemeStatusDimension,
  status: { code?: SchemeStatusCode; label?: string | null }
): string {
  const descriptor =
    findSchemeStatusByCode(dimension, status.code) ??
    findSchemeStatusByLabel(dimension, status.label)

  if (descriptor) {
    return t(descriptor.i18nKey, { defaultValue: descriptor.label })
  }

  const rawLabel = typeof status.label === 'string' ? status.label.trim() : ''
  if (rawLabel) {
    return rawLabel
  }

  return t(UNKNOWN_SCHEME_STATUS_I18N_KEY, { defaultValue: 'Unknown' })
}

export interface SchemeStatusOption {
  /** Canonical English label — the value to send on the wire. */
  value: string
  /** Translated label for display. */
  label: string
  code: number
}

/**
 * Selectable statuses for a dimension, in UI order, with translated display labels and canonical
 * English wire values. Shared by the scheme-list filters and the editable status chip menu.
 *
 * The wire value is the label rather than the code deliberately: `operatingStatus` code 0 is
 * Non-Operative, and the scheme-list service strips falsy query params — a numeric 0 would silently
 * drop the filter and return every scheme with a 200. Labels also match what the rows carry and
 * what `PATCH /schemes/{id}/status` accepts.
 */
export function getSchemeStatusOptions(
  t: SchemeStatusTranslate,
  dimension: SchemeStatusDimension
): SchemeStatusOption[] {
  return SCHEME_STATUS_DESCRIPTORS[dimension].map((descriptor) => ({
    value: descriptor.label,
    label: t(descriptor.i18nKey, { defaultValue: descriptor.label }),
    code: descriptor.code,
  }))
}

/**
 * Count for one code. Returns 0 when the bucket is absent, so callers never need a `?? 0`.
 * Sums rather than finds: a malformed payload with duplicate codes must not silently lose data.
 */
export function getSchemeStatusCount(
  buckets: readonly SchemeStatusCount[] | undefined | null,
  code: SchemeStatusCode
): number {
  if (!buckets) return 0
  return buckets.reduce((total, bucket) => (bucket.code === code ? total + bucket.count : total), 0)
}

/** Ascending by code with an unrecorded status (`code: null`) last. Never mutates the input. */
export function sortSchemeStatusCounts<T extends { code: SchemeStatusCode }>(
  buckets: readonly T[] | undefined | null
): T[] {
  if (!buckets) return []
  return [...buckets].sort((a, b) => {
    if (a.code === null) return b.code === null ? 0 : 1
    if (b.code === null) return -1
    return a.code - b.code
  })
}
