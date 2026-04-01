import { useCallback, useMemo } from 'react'
import { useTheme } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import * as echarts from 'echarts'
import { EChartsWrapper } from '@/shared/components/common'
import { ChartEmptyState } from '@/shared/components/common/chart-empty-state'
import { getBodyText7Style } from '@/shared/components/charts/chart-text-style'
import type { PumpOperatorsData } from '../../types'

interface ActiveSchemesChartProps {
  data: PumpOperatorsData[]
  className?: string
  height?: string | number
  note?: string
}

const defaultColors = ['#3291D1', '#ADD3ED']
const donutRadius: [string, string] = ['58%', '98%']
const donutCenter: [string, string] = ['50%', '50%']
const legendKeyByNormalizedLabel: Record<string, 'active' | 'inactive'> = {
  active: 'active',
  'active scheme': 'active',
  'active schemes': 'active',
  'active pump operator': 'active',
  'active pump operators': 'active',
  inactive: 'inactive',
  'non active scheme': 'inactive',
  'non active schemes': 'inactive',
  'inactive scheme': 'inactive',
  'inactive schemes': 'inactive',
  'inactive pump operator': 'inactive',
  'inactive pump operators': 'inactive',
  'non active pump operator': 'inactive',
  'non active pump operators': 'inactive',
}

const normalizeLegendLabel = (label: string) =>
  label.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')

export function ActiveSchemesChart({
  data,
  className,
  height = '360px',
  note,
}: ActiveSchemesChartProps) {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const theme = useTheme()
  const bodyText7 = getBodyText7Style(theme)
  const noDataLabel = tCommon('noDataAvailable', { defaultValue: 'No data available' })
  const noteColor = theme?.colors?.neutral?.['950'] ?? bodyText7.color ?? '#667085'
  const localizedLegendLabel = useCallback(
    (label: string) => {
      const legendKey = legendKeyByNormalizedLabel[normalizeLegendLabel(label)]
      if (legendKey === 'active') {
        return t('pumpOperators.legend.active', { defaultValue: 'Active schemes' })
      }
      if (legendKey === 'inactive') {
        return t('pumpOperators.legend.inactive', { defaultValue: 'Non-active schemes' })
      }

      return label
    },
    [t]
  )

  const option = useMemo<echarts.EChartsOption>(() => {
    const totalOperators = data.reduce((sum, entry) => sum + entry.value, 0)

    return {
      tooltip: {
        show: true,
        trigger: 'item',
        formatter: (params: unknown) => {
          const point = params as { name?: string; value?: number | string }
          const rawValue =
            typeof point.value === 'number' ? point.value : Number(point.value ?? Number.NaN)
          const hasNumericValue = Number.isFinite(rawValue)
          const percentage =
            hasNumericValue && totalOperators > 0
              ? ` (${((rawValue / totalOperators) * 100).toFixed(1)}%)`
              : ''
          const formattedValue = hasNumericValue ? rawValue.toFixed(1) : '-'

          return `<strong>${point.name ?? ''}</strong><br/>${formattedValue}${percentage}`
        },
      },
      series: [
        {
          type: 'pie',
          radius: donutRadius,
          center: donutCenter,
          startAngle: 360,
          clockwise: true,
          avoidLabelOverlap: true,
          emphasis: {
            scale: true,
            scaleSize: 2,
          },
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          data: data.map((entry, index) => ({
            name: localizedLegendLabel(entry.label),
            value: entry.value,
            itemStyle: {
              color: defaultColors[index % defaultColors.length],
            },
            emphasis: {
              itemStyle: {
                color: defaultColors[index % defaultColors.length],
              },
            },
          })),
        },
      ],
    }
  }, [data, localizedLegendLabel])

  const containerHeight = typeof height === 'number' ? `${height}px` : height
  const chartSize = 300
  const hasRenderableData = data.some((entry) => Number.isFinite(entry.value) && entry.value > 0)
  const legendItems = hasRenderableData
    ? data.map((entry, index) => ({
        key: `${entry.label}-${index}`,
        label: localizedLegendLabel(entry.label),
        color: defaultColors[index % defaultColors.length],
      }))
    : []

  return (
    <div
      className={className}
      style={{
        width: '100%',
        minWidth: 0,
        height: containerHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '594px',
          minWidth: 0,
          minHeight: '336px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: `${chartSize}px`,
            aspectRatio: '1 / 1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {hasRenderableData ? (
            <EChartsWrapper option={option} height="100%" />
          ) : (
            <ChartEmptyState minHeight="100%" message={noDataLabel} />
          )}
        </div>
        {legendItems.length > 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              width: '100%',
              flexWrap: 'wrap',
              rowGap: '6px',
            }}
          >
            {legendItems.map((item) => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '2px',
                    backgroundColor: item.color,
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontSize: bodyText7.fontSize,
                    lineHeight: `${bodyText7.lineHeight}px`,
                    fontWeight: 400,
                    color: bodyText7.color,
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {note && hasRenderableData ? (
        <div
          style={{
            fontSize: bodyText7.fontSize,
            lineHeight: `${bodyText7.lineHeight}px`,
            fontWeight: 400,
            color: noteColor,
            textAlign: 'left',
            paddingTop: '40px',
            width: '100%',
            paddingBottom: '0px',
          }}
        >
          {note}
        </div>
      ) : null}
    </div>
  )
}
