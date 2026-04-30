const DEFAULT_SCREEN_DATE_FORMAT = 'DD/MM/YYYY'

const SUPPORTED_DATE_FORMATS = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY/MM/DD',
  'DD/MM/YY',
  'MM/DD/YY',
  'DD/MON/YYYY',
  'DD/MON/YY',
] as const

type DatePartToken = 'DD' | 'MM' | 'MON' | 'YYYY' | 'YY'

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
  const separator = normalizedFormat.includes('/')
    ? '/'
    : normalizedFormat.replace(/[DMY]/g, '').charAt(0) || '/'
  const tokens = normalizedFormat.split(separator) as DatePartToken[]

  return {
    format: normalizedFormat,
    separator,
    tokens,
  }
}

const buildIsoDate = (year: string, month: string, day: string) => `${year}-${month}-${day}`

const MONTH_ABBREVIATIONS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const

const MONTH_ABBREVIATION_TO_NUMBER = MONTH_ABBREVIATIONS.reduce<Record<string, string>>(
  (acc, month, index) => {
    acc[month] = String(index + 1).padStart(2, '0')
    return acc
  },
  {}
)

const resolveMonthAbbreviation = (month: string) =>
  MONTH_ABBREVIATION_TO_NUMBER[month.trim().toUpperCase()] ?? ''

export const normalizeDateFormat = (format?: string | null) => parseDateFormat(format).format

const buildFallbackFormats = (preferredFormat?: string | null) => {
  const normalizedPreferredFormat = normalizeDateFormat(preferredFormat)
  const preferredShortYearFormat = normalizedPreferredFormat.replace('YYYY', 'YY')
  const formats = [normalizedPreferredFormat]

  if (
    preferredShortYearFormat !== normalizedPreferredFormat &&
    SUPPORTED_DATE_FORMATS.includes(
      preferredShortYearFormat as (typeof SUPPORTED_DATE_FORMATS)[number]
    )
  ) {
    formats.push(preferredShortYearFormat)
  }

  for (const format of SUPPORTED_DATE_FORMATS) {
    if (format === normalizedPreferredFormat || format === preferredShortYearFormat) {
      continue
    }

    formats.push(format)
  }

  return formats
}

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
    MON: MONTH_ABBREVIATIONS[Number(month) - 1] ?? month,
    YYYY: options.shortYear ? year.slice(-2) : year,
    YY: year.slice(-2),
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
    `^${tokens
      .map((token) => {
        if (token === 'MON') {
          return '([A-Za-z]{3})'
        }

        return token === 'YYYY' ? '(\\d{4})' : '(\\d{2})'
      })
      .join(escapedSeparator)}$`,
    'i'
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
    { DD: '', MM: '', MON: '', YYYY: '', YY: '' }
  )

  const resolvedMonth = values.MM || resolveMonthAbbreviation(values.MON)
  const resolvedYear =
    values.YYYY.length === 4
      ? values.YYYY
      : values.YY.length === 2
        ? (() => {
            const parsedYear = Number.parseInt(values.YY, 10)
            if (!Number.isFinite(parsedYear)) {
              return ''
            }

            return String(parsedYear >= 70 ? 1900 + parsedYear : 2000 + parsedYear)
          })()
        : ''

  if (!values.DD || !resolvedMonth || !resolvedYear) {
    return ''
  }

  return buildIsoDate(resolvedYear, resolvedMonth, values.DD)
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
  const formats = buildFallbackFormats(preferredFormat)

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
