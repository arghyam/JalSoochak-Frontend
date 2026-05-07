import type { MonthlyTrendPoint } from '../components/charts/monthly-trend-chart'
import type {
  DemandSupplyData,
  NationalSchemeRegularityPeriodicMetric,
  NationalSchemeRegularityPeriodicResponse,
  OutageReasonsPeriodicMetric,
  OutageReasonsPeriodicResponse,
  SchemeRegularityPeriodicMetric,
  SchemeRegularityPeriodicResponse,
  WaterQuantityPeriodicMetric,
  WaterQuantityPeriodicResponse,
} from '../types'
import { formatIsoDateForDisplay, normalizeDateFormat } from '@/shared/utils/date-format'
import { DEFAULT_PERSONS_PER_HOUSEHOLD } from './formulas'

const parseIsoDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatSingleDateNumeric = (value: string, dateFormat?: string) => {
  const date = parseIsoDate(value)
  if (!date) {
    return value
  }

  return formatIsoDateForDisplay(value, normalizeDateFormat(dateFormat ?? 'DD/MM/YYYY'))
}

const formatMetricLabel = (
  scale: string,
  metric: Pick<
    WaterQuantityPeriodicMetric | SchemeRegularityPeriodicMetric,
    'periodStartDate' | 'periodEndDate'
  >,
  dateFormat?: string
) => {
  const startLabel = formatSingleDateNumeric(metric.periodStartDate, dateFormat)
  const endLabel = formatSingleDateNumeric(metric.periodEndDate, dateFormat)

  if (startLabel === endLabel) {
    return startLabel
  }

  if (scale === 'week' || scale === 'month' || scale === 'quarter' || scale === 'year') {
    return `${startLabel}\n${endLabel}`
  }

  return `${startLabel} - ${endLabel}`
}

const toRegularityPercent = (value: number) => (value <= 1 ? value * 100 : value)

const resolveMetricDaysInRange = (startDate: string, endDate: string) => {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)

  if (!start || !end || start > end) {
    return 0
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1
}

const getMetricPeriodKey = (
  metric: Pick<
    WaterQuantityPeriodicMetric | SchemeRegularityPeriodicMetric,
    'periodStartDate' | 'periodEndDate'
  >
) => `${metric.periodStartDate}|${metric.periodEndDate}`

const getAchievedFhtcCount = (metric: WaterQuantityPeriodicMetric | undefined) => {
  if (!metric) {
    return 0
  }

  const count = Number(metric.totalAchievedFhtcCount ?? metric.achievedFhtcCount ?? 0)
  return Number.isFinite(count) && count > 0 ? count : 0
}

export const resolveWaterQuantityPeriodicScale = (
  startDate: string,
  endDate: string
): 'day' | 'week' | 'month' => {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)

  if (!start || !end || start > end) {
    return 'day'
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000
  const daysInRange = Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1

  if (daysInRange <= 31) {
    return 'day'
  }

  if (daysInRange <= 120) {
    return 'week'
  }

  return 'month'
}

export const mapWaterQuantityPeriodicToTrendPoints = (
  response: WaterQuantityPeriodicResponse | undefined,
  dateFormat?: string
): MonthlyTrendPoint[] => {
  if (!response?.metrics?.length) {
    return []
  }

  return response.metrics.flatMap((metric) => {
    if (!metric.periodStartDate || !metric.periodEndDate) {
      return []
    }

    const waterQuantity = metric.totalWaterQuantity ?? metric.averageWaterQuantity

    if (typeof waterQuantity !== 'number' || !Number.isFinite(waterQuantity)) {
      return []
    }

    return [
      {
        period: formatMetricLabel(response.scale, metric, dateFormat),
        value: waterQuantity,
      },
    ]
  })
}

export const mapSchemeRegularityPeriodicToTrendPoints = (
  response: SchemeRegularityPeriodicResponse | undefined,
  dateFormat?: string
): MonthlyTrendPoint[] => {
  if (!response?.metrics?.length) {
    return []
  }

  return response.metrics
    .filter(
      (metric) =>
        typeof metric.averageRegularity === 'number' &&
        Number.isFinite(metric.averageRegularity) &&
        Boolean(metric.periodStartDate) &&
        Boolean(metric.periodEndDate)
    )
    .map((metric) => ({
      period: formatMetricLabel(response.scale, metric, dateFormat),
      value: toRegularityPercent(metric.averageRegularity),
    }))
}

export const mapSchemeRegularityQuantityToTrendPoints = (
  response: SchemeRegularityPeriodicResponse | undefined,
  dateFormat?: string,
  waterQuantityResponse?: WaterQuantityPeriodicResponse,
  averagePersonsPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD
): MonthlyTrendPoint[] => {
  if (!response?.metrics?.length) {
    return []
  }

  const waterQuantityMetricsByPeriod = new Map(
    (waterQuantityResponse?.metrics ?? [])
      .filter((metric) => Boolean(metric.periodStartDate) && Boolean(metric.periodEndDate))
      .map((metric) => [getMetricPeriodKey(metric), metric])
  )

  return response.metrics.flatMap((metric) => {
    if (!metric.periodStartDate || !metric.periodEndDate) {
      return []
    }

    if (
      typeof metric.totalWaterQuantity !== 'number' ||
      !Number.isFinite(metric.totalWaterQuantity)
    ) {
      return []
    }

    const matchingWaterQuantityMetric = waterQuantityMetricsByPeriod.get(getMetricPeriodKey(metric))
    const achievedFhtcCount = getAchievedFhtcCount(matchingWaterQuantityMetric)
    const metricDays = resolveMetricDaysInRange(metric.periodStartDate, metric.periodEndDate)

    if (
      achievedFhtcCount <= 0 ||
      metricDays <= 0 ||
      !Number.isFinite(averagePersonsPerHousehold) ||
      averagePersonsPerHousehold <= 0
    ) {
      return []
    }

    return [
      {
        period: formatMetricLabel(response.scale, metric, dateFormat),
        value: Number(
          (
            metric.totalWaterQuantity /
            (achievedFhtcCount * averagePersonsPerHousehold * metricDays)
          ).toFixed(1)
        ),
      },
    ]
  })
}

export const mapDemandSupplyToTrendPoints = (
  demandSupply: DemandSupplyData[] | undefined,
  valueSelector: (item: DemandSupplyData) => number
): MonthlyTrendPoint[] => {
  if (!demandSupply?.length) {
    return []
  }

  return demandSupply
    .filter((item) => Boolean(item.period))
    .map((item) => ({
      period: item.period,
      value: valueSelector(item),
    }))
    .filter((item) => Number.isFinite(item.value))
}

export const mapNationalQuantityTrendPoints = (
  response: NationalSchemeRegularityPeriodicResponse | undefined,
  dateFormat?: string,
  averagePersonsPerHousehold = DEFAULT_PERSONS_PER_HOUSEHOLD
): MonthlyTrendPoint[] => {
  if (!response?.metrics?.length) {
    return []
  }

  return response.metrics.flatMap((metric) => {
    if (
      typeof metric.totalWaterQuantity === 'number' &&
      Number.isFinite(metric.totalWaterQuantity) &&
      Boolean(metric.periodStartDate) &&
      Boolean(metric.periodEndDate)
    ) {
      const achievedFhtcCount = Number(
        metric.totalAchievedFhtcCount ?? response.totalAchievedFhtcCount ?? 0
      )
      const metricDays = resolveMetricDaysInRange(metric.periodStartDate, metric.periodEndDate)

      if (
        achievedFhtcCount > 0 &&
        metricDays > 0 &&
        Number.isFinite(averagePersonsPerHousehold) &&
        averagePersonsPerHousehold > 0
      ) {
        return [
          {
            period: formatMetricLabel(response.scale, metric, dateFormat),
            value: Number(
              (
                metric.totalWaterQuantity /
                (achievedFhtcCount * averagePersonsPerHousehold * metricDays)
              ).toFixed(1)
            ),
          },
        ]
      }
    }

    return []
  })
}

export const mapNationalRegularityTrendPoints = (
  response: NationalSchemeRegularityPeriodicResponse | undefined,
  dateFormat?: string
): MonthlyTrendPoint[] => {
  if (!response?.metrics?.length) {
    return []
  }

  return response.metrics
    .filter(
      (
        metric
      ): metric is NationalSchemeRegularityPeriodicMetric &
        Required<
          Pick<NationalSchemeRegularityPeriodicMetric, 'periodStartDate' | 'periodEndDate'>
        > =>
        typeof metric.averageRegularity === 'number' &&
        Number.isFinite(metric.averageRegularity) &&
        Boolean(metric.periodStartDate) &&
        Boolean(metric.periodEndDate)
    )
    .map((metric) => ({
      period: formatMetricLabel(response.scale, metric, dateFormat),
      value: toRegularityPercent(metric.averageRegularity),
    }))
}

const getOutageMetricTotal = (metric: OutageReasonsPeriodicMetric) =>
  Object.values(metric.outageReasonSchemeCount ?? {}).reduce((total, value) => {
    return total + (typeof value === 'number' && Number.isFinite(value) ? value : 0)
  }, 0)

export const mapOutageReasonsPeriodicToTrendPoints = (
  response: OutageReasonsPeriodicResponse | undefined,
  dateFormat?: string
): MonthlyTrendPoint[] => {
  if (!response?.metrics?.length) {
    return []
  }

  return response.metrics
    .filter((metric) => Boolean(metric.periodStartDate) && Boolean(metric.periodEndDate))
    .map((metric) => ({
      period: formatMetricLabel(response.scale, metric, dateFormat),
      value: getOutageMetricTotal(metric),
    }))
}
