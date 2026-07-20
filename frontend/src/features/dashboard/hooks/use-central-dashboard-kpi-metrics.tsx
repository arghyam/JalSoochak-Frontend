import { Flex, Icon, Image, Text, Box } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import type { TFunction } from 'i18next'
import { MdOutlineWaterDrop } from 'react-icons/md'
import waterTapIcon from '@/assets/media/water-tap_1822589 1.svg'
import wallClockIcon from '@/assets/media/wall-clock.svg'
import { calculateAbsoluteChange, calculatePercentChange } from '../utils/formulas'

const formulaTooltipTextStyle = {
  fontSize: '12px',
  lineHeight: '18px',
} as const

const renderFormulaTooltip = (formula: ReactNode, definitions: ReactNode[]) => (
  <Box w="296px">
    <Text sx={formulaTooltipTextStyle} mb={definitions.length > 0 ? '8px' : '0'}>
      {formula}
    </Text>
    {definitions.map((definition, index) => (
      <Text key={index} sx={formulaTooltipTextStyle}>
        {definition}
      </Text>
    ))}
  </Box>
)

type Trend = {
  direction: 'up' | 'down' | 'neutral'
  text: string
}

type WaterSupplyKpis = {
  quantityMld: number
  quantityLpcd: number
}

type BuildCentralDashboardKpiMetricsParams = {
  comparisonDays: number
  criticalSchemeStatusAfterDays: number
  currentRegularityKpi: number
  currentWaterSupplyKpis: WaterSupplyKpis
  isCentralLandingView: boolean
  numberLocale: string
  previousContinuousSchemesCount: number
  previousRegularityKpi: number
  previousWaterSupplyKpis: WaterSupplyKpis
  t: TFunction<'dashboard'>
  continuousSchemesCount: number
  criticalSchemesCount: number
}

export function buildCentralDashboardKpiMetrics({
  comparisonDays,
  criticalSchemeStatusAfterDays,
  currentRegularityKpi,
  currentWaterSupplyKpis,
  isCentralLandingView,
  numberLocale,
  previousContinuousSchemesCount,
  previousRegularityKpi,
  previousWaterSupplyKpis,
  t,
  continuousSchemesCount,
  criticalSchemesCount,
}: BuildCentralDashboardKpiMetricsParams) {
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(numberLocale, options).format(value)

  const formatQuantityMld = (value: number) => {
    if (!Number.isFinite(value)) {
      return formatNumber(0, { maximumFractionDigits: 0 })
    }

    const absoluteValue = Math.abs(value)
    if (Number.isInteger(value)) {
      return formatNumber(value, { maximumFractionDigits: 0 })
    }

    if (absoluteValue > 0 && absoluteValue < 1) {
      return formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    return formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 1 })
  }

  const formatSignedValue = (value: number, options?: Intl.NumberFormatOptions) => {
    const absoluteValue = Math.abs(value)
    const formatted = new Intl.NumberFormat(numberLocale, options).format(absoluteValue)
    if (value > 0) {
      return `+${formatted}`
    }
    if (value < 0) {
      return `-${formatted}`
    }
    return formatted
  }

  const toTrendDirection = (value: number): Trend['direction'] => {
    if (value > 0) return 'up'
    if (value < 0) return 'down'
    return 'neutral'
  }

  const buildNeutralAwareTrend = (
    currentValue: number,
    changeValue: number,
    formatter: (value: number) => string
  ): Trend => {
    if (currentValue === 0) {
      return {
        direction: 'neutral',
        text: formatter(0),
      }
    }

    return {
      direction: toTrendDirection(changeValue),
      text: formatter(changeValue),
    }
  }

  const getCountPercentChange = (currentValue: number, previousValue: number) => {
    if (currentValue > 0 && previousValue < 0) {
      return 100
    }

    return calculatePercentChange(currentValue, previousValue)
  }

  const formatPercentTrend = (changeValue: number) =>
    t('kpi.trends.percentVsPreviousDays', {
      change: formatSignedValue(changeValue, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
      days: comparisonDays,
      count: comparisonDays,
      defaultValue: '{{change}}% vs previous {{days}} days',
    })

  const formatLpcdTrend = (changeValue: number) =>
    t('kpi.trends.lpcdVsPreviousDays', {
      change: formatSignedValue(changeValue, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
      days: comparisonDays,
      count: comparisonDays,
      defaultValue: '{{change}} LPCD vs previous {{days}} days',
    })

  const buildCountPercentTrend = (currentValue: number, previousValue: number): Trend => {
    const changeValue = getCountPercentChange(currentValue, previousValue)

    return {
      direction:
        currentValue === 0 && previousValue === 0 ? 'neutral' : toTrendDirection(changeValue),
      text: formatPercentTrend(changeValue),
    }
  }

  const quantityMldChange = calculatePercentChange(
    currentWaterSupplyKpis.quantityMld,
    previousWaterSupplyKpis.quantityMld
  )
  const quantityLpcdChange = calculateAbsoluteChange(
    currentWaterSupplyKpis.quantityLpcd,
    previousWaterSupplyKpis.quantityLpcd
  )
  const regularityChange = calculatePercentChange(currentRegularityKpi, previousRegularityKpi)

  const metrics = [
    {
      label: t('kpi.labels.schemesSupplyingWater', {
        defaultValue: 'Schemes Supplying Water',
      }),
      value: formatNumber(continuousSchemesCount),
      trend: buildCountPercentTrend(continuousSchemesCount, previousContinuousSchemesCount),
      tooltipContent: t('kpi.tooltips.schemesSupplyingWater.description', {
        defaultValue:
          'Count of schemes that supplied water for the selected date range consistently.',
      }),
    },
    {
      label: t('kpi.labels.quantityInMld', { defaultValue: 'Quantity in MLD' }),
      value: formatQuantityMld(currentWaterSupplyKpis.quantityMld),
      trend: buildNeutralAwareTrend(
        currentWaterSupplyKpis.quantityMld,
        quantityMldChange,
        formatPercentTrend
      ),
      icon: (
        <Flex w="48px" h="48px" borderRadius="100px" bg="#EAF2FA" align="center" justify="center">
          <Image src={waterTapIcon} alt="" w="24px" h="24px" />
        </Flex>
      ),
      tooltipContent: renderFormulaTooltip(
        <>
          {t('kpi.tooltips.quantityMld.formulaLabel', {
            defaultValue: 'Quantity (MLD: Million Liters per Day)',
          })}{' '}
          = SUM(W<sub>k</sub>) / N
        </>,
        [
          <>
            MLD ={' '}
            {t('kpi.tooltips.quantityMld.definitions.mldFullForm', {
              defaultValue: 'Million Liters per Day',
            })}
          </>,
          <>
            W<sub>k</sub> ={' '}
            {t('kpi.tooltips.quantityMld.definitions.waterQuantitySupplied', {
              defaultValue: 'water quantity supplied on day k',
            })}
          </>,
          <>
            SUM(Wk) ={' '}
            {t('kpi.tooltips.quantityMld.definitions.totalWaterSupplied', {
              defaultValue: 'total water supplied across all days',
            })}
          </>,
          <>
            N ={' '}
            {t('kpi.tooltips.quantityMld.definitions.totalNumberOfDays', {
              defaultValue: 'total number of days in the selected time-period',
            })}
          </>,
        ]
      ),
    },
    {
      label: t('kpi.labels.quantityInLpcd', { defaultValue: 'Quantity in LPCD' }),
      value: formatNumber(currentWaterSupplyKpis.quantityLpcd, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
      trend: buildNeutralAwareTrend(
        currentWaterSupplyKpis.quantityLpcd,
        quantityLpcdChange,
        formatLpcdTrend
      ),
      icon: (
        <Flex w="48px" h="48px" borderRadius="100px" bg="#EAF2FA" align="center" justify="center">
          <Icon as={MdOutlineWaterDrop} w="24px" h="24px" color="#2E90FA" />
        </Flex>
      ),
      tooltipContent: renderFormulaTooltip(
        <>
          {t('kpi.tooltips.quantityLpcd.formulaLabel', {
            defaultValue: 'Quantity (LPCD: Litres per Capita per Day)',
          })}{' '}
          = SUM(W<sub>k</sub>) / (SUM(FHTC<sub>i</sub>) x P x N)
        </>,
        [
          <>
            LPCD ={' '}
            {t('kpi.tooltips.quantityLpcd.definitions.lpcdFullForm', {
              defaultValue: 'Litres per Capita per Day',
            })}
          </>,
          <>
            W<sub>k</sub> ={' '}
            {t('kpi.tooltips.quantityLpcd.definitions.waterQuantitySupplied', {
              defaultValue: 'water quantity supplied on kth day',
            })}
          </>,
          <>
            FHTC<sub>i</sub> ={' '}
            {t('kpi.tooltips.quantityLpcd.definitions.functionalHouseholdTapConnections', {
              defaultValue: 'functional household tap connections of scheme i',
            })}
          </>,
          <>
            P ={' '}
            {t('kpi.tooltips.quantityLpcd.definitions.averagePersonsPerHousehold', {
              defaultValue: 'average persons per household',
            })}
          </>,
          <>
            N ={' '}
            {t('kpi.tooltips.quantityLpcd.definitions.numberOfDays', {
              defaultValue: 'total number of days in the selected time-period',
            })}
          </>,
        ]
      ),
    },
    {
      label: t('kpi.labels.regularity', { defaultValue: 'Regularity' }),
      value: `${formatNumber(currentRegularityKpi, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`,
      trend: buildNeutralAwareTrend(currentRegularityKpi, regularityChange, formatPercentTrend),
      icon: (
        <Flex w="48px" h="48px" borderRadius="100px" bg="#EAF2FA" align="center" justify="center">
          <Image src={wallClockIcon} alt="" w="24px" h="24px" />
        </Flex>
      ),
      tooltipContent: renderFormulaTooltip(
        <>
          {t('kpi.tooltips.regularity.formulaLabel', { defaultValue: 'Regularity' })} = R / S * 100
        </>,
        [
          <>
            R ={' '}
            {t('kpi.tooltips.regularity.definitions.regularSchemes', {
              defaultValue: 'number of schemes supplying water regularly',
            })}
          </>,
          <>
            S ={' '}
            {t('kpi.tooltips.regularity.definitions.totalSchemes', {
              defaultValue: 'total number of schemes',
            })}
          </>,
        ]
      ),
    },
    {
      label: t('kpi.labels.criticalSchemes', { defaultValue: 'Critical Schemes' }),
      value: formatNumber(criticalSchemesCount),
      tooltipContent: t('kpi.tooltips.criticalSchemes.description', {
        days: criticalSchemeStatusAfterDays,
        defaultValue: 'Schemes identified as failing to supply water, based on {{days}} days.',
      }),
    },
  ] as const

  return isCentralLandingView ? metrics.slice(1, 4) : metrics
}
