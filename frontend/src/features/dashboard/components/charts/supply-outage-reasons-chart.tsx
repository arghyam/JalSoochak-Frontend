import { useMemo } from 'react'
import { useTheme } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import * as echarts from 'echarts'
import { EChartsWrapper } from '@/shared/components/common'
import { ChartEmptyState } from '@/shared/components/common/chart-empty-state'
import { getBodyText7Style } from '@/shared/components/charts/chart-text-style'
import type { WaterSupplyOutageData } from '../../types'
import { hasRenderableSupplyOutageReasons } from '../../utils/supply-outage'

interface SupplyOutageReasonsChartProps {
  data: WaterSupplyOutageData[]
  className?: string
  height?: string | number
  pieSize?: number
}

const outageColors = [
  '#EBF4FA',
  '#D6E9F6',
  '#C2DEF1',
  '#ADD3ED',
  '#84BDE3',
  '#5BA7DA',
  '#3291D1',
  '#2874A7',
  '#1E577D',
  '#143A54',
]
const chartLegendGapPx = 20

const toDisplayLabel = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (character) => character.toUpperCase())

export function SupplyOutageReasonsChart({
  data,
  className,
  height = '300px',
  pieSize = 300,
}: SupplyOutageReasonsChartProps) {
  const { t: tCommon } = useTranslation('common')
  const theme = useTheme()
  const bodyText7 = getBodyText7Style(theme)
  const noDataLabel = tCommon('noDataAvailable', { defaultValue: 'No data available' })
  const chartItems = useMemo(() => {
    const totals = new Map<string, number>()
    const addValidatedTotal = (reasonKey: string, value: unknown) => {
      const numericValue = Number(value)
      if (!Number.isFinite(numericValue)) {
        return
      }

      totals.set(reasonKey, (totals.get(reasonKey) ?? 0) + numericValue)
    }

    data.forEach((entry) => {
      Object.entries(entry.reasons ?? {}).forEach(([reasonKey, value]) => {
        addValidatedTotal(reasonKey, value)
      })
    })

    return Array.from(totals.entries())
      .filter(([, value]) => Number.isFinite(value) && value > 0)
      .map(([reasonKey, value], index) => {
        const label = toDisplayLabel(reasonKey)
        const color = outageColors[index % outageColors.length]

        return {
          key: reasonKey,
          label,
          value,
          color,
        }
      })
  }, [data])
  const hasRenderableData = useMemo(() => hasRenderableSupplyOutageReasons(data), [data])

  const option: echarts.EChartsOption = useMemo(() => {
    const totalOutages = chartItems.reduce((sum, item) => sum + item.value, 0)

    return {
      tooltip: {
        show: true,
        trigger: 'item',
        confine: true,
        position: (point, _params, _el, _rect, size) => {
          const viewWidth = size.viewSize[0]
          const viewHeight = size.viewSize[1]
          const contentWidth = size.contentSize[0]
          const contentHeight = size.contentSize[1]
          const spacingX = 12
          const spacingY = 12
          const hoverX = point[0] ?? viewWidth / 2
          const hoverY = point[1] ?? viewHeight / 2

          const preferredX = hoverX + spacingX
          const fallbackX = hoverX - contentWidth - spacingX
          const preferredY = hoverY - contentHeight / 2

          return [
            preferredX + contentWidth <= viewWidth ? preferredX : Math.max(spacingX, fallbackX),
            Math.max(spacingY, Math.min(preferredY, viewHeight - contentHeight - spacingY)),
          ]
        },
        formatter: (params: unknown) => {
          const point = params as { name?: string; value?: number | string }
          const rawValue =
            typeof point.value === 'number' ? point.value : Number(point.value ?? Number.NaN)
          const hasNumericValue = Number.isFinite(rawValue)
          const percentage =
            hasNumericValue && totalOutages > 0
              ? ` (${((rawValue / totalOutages) * 100).toFixed(1)}%)`
              : ''
          const formattedValue = hasNumericValue ? rawValue.toFixed(1) : '-'

          return `<strong>${point.name ?? ''}</strong><br/>${formattedValue}${percentage}`
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['0%', '98%'],
          center: ['50%', '50%'],
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
          data: chartItems.map((item) => ({
            name: item.label,
            value: item.value,
            itemStyle: { color: item.color },
            emphasis: { itemStyle: { color: item.color } },
          })),
        },
      ],
    }
  }, [chartItems])

  const containerHeight = typeof height === 'number' ? `${height}px` : height
  const legendItems = chartItems.map(({ key, label, color }) => ({ key, label, color }))

  if (!hasRenderableData) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: containerHeight,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ChartEmptyState minHeight="100%" message={noDataLabel} />
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: containerHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: `${pieSize}px`,
          height: `${pieSize}px`,
          maxWidth: '100%',
          margin: '0 auto',
        }}
      >
        <EChartsWrapper option={option} height="100%" />
      </div>
      {legendItems.length > 0 ? (
        <div
          style={{
            marginTop: `${chartLegendGapPx}px`,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            paddingTop: 0,
            flexWrap: 'wrap',
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
  )
}
