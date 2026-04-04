const DEFAULT_SCREEN_DATE_FORMAT = 'DD/MM/YYYY'

const SUPPORTED_DATE_FORMATS = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY/MM/DD',
  'DD-MM-YYYY',
  'MM-DD-YYYY',
  'YYYY-MM-DD',
  'DD.MM.YYYY',
  'MM.DD.YYYY',
  'YYYY.MM.DD',
] as const

type DatePartToken = 'DD' | 'MM' | 'YYYY'

type ParsedDateFormat = {
  format: string
  separator: string
  tokens: DatePartToken[]
}

const parseDateFormat = (format?: string | null): ParsedDateFormat => {
  const normalizedFormat =
    typeof format === 'string' &&
    SUPPORTED_DATE_FORMATS.includes(format as (typeof SUPPORTED_DATE_FORMATS)[number])
      ? format
      : DEFAULT_SCREEN_DATE_FORMAT
  const separator = normalizedFormat.replace(/[DMY]/g, '').charAt(0) || '/'
  const tokens = normalizedFormat.split(separator) as DatePartToken[]

  return {
    format: normalizedFormat,
    separator,
    tokens,
  }
}

const buildIsoDate = (year: string, month: string, day: string) => `${year}-${month}-${day}`

export const normalizeDateFormat = (format?: string | null) => parseDateFormat(format).format

export const getDateInputPlaceholder = (format?: string | null) =>
  normalizeDateFormat(format).toLowerCase()

export const formatIsoDateForDisplay = (
  value: string,
  format?: string | null,
  options: { shortYear?: boolean } = {}
) => {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) {
    return value
  }

  const { separator, tokens } = parseDateFormat(format)
  const values: Record<DatePartToken, string> = {
    DD: day,
    MM: month,
    YYYY: options.shortYear ? year.slice(-2) : year,
  }

  return tokens.map((token) => values[token]).join(separator)
}

export const formatDateForDisplay = (
  value: Date,
  format?: string | null,
  options: { shortYear?: boolean } = {}
) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return ''
  }

  const isoDate = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  return formatIsoDateForDisplay(isoDate, format, options)
}

export const parseDisplayDateToIso = (value: string, format?: string | null) => {
  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return trimmedValue
  }

  const { separator, tokens } = parseDateFormat(format)
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matcher = new RegExp(
    `^(\\d{2}|\\d{4})${escapedSeparator}(\\d{2}|\\d{4})${escapedSeparator}(\\d{2}|\\d{4})$`
  )
  const match = trimmedValue.match(matcher)
  if (!match) {
    return ''
  }

  const parts = match.slice(1)
  const values = tokens.reduce<Record<DatePartToken, string>>(
    (acc, token, index) => {
      acc[token] = parts[index] ?? ''
      return acc
    },
    { DD: '', MM: '', YYYY: '' }
  )

  if (!values.DD || !values.MM || values.YYYY.length !== 4) {
    return ''
  }

  return buildIsoDate(values.YYYY, values.MM, values.DD)
}

export const isValidDisplayDate = (value: string, format?: string | null) => {
  const isoDate = parseDisplayDateToIso(value, format)
  if (!isoDate) {
    return false
  }

  const [year, month, day] = isoDate.split('-').map((part) => Number(part))
  if (!year || !month || !day) {
    return false
  }

  if (month < 1 || month > 12) {
    return false
  }

  const maxDay = new Date(year, month, 0).getDate()
  return day >= 1 && day <= maxDay
}

export const parseDisplayDateToIsoWithFallback = (
  value: string,
  preferredFormat?: string | null
) => {
  const formats = [
    normalizeDateFormat(preferredFormat),
    ...SUPPORTED_DATE_FORMATS.filter((format) => format !== normalizeDateFormat(preferredFormat)),
  ]

  for (const format of formats) {
    if (!isValidDisplayDate(value, format)) {
      continue
    }

    const isoDate = parseDisplayDateToIso(value, format)
    if (isoDate) {
      return isoDate
    }
  }

  return ''
}

export { DEFAULT_SCREEN_DATE_FORMAT }
