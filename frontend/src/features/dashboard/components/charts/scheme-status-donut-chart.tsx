import { useMediaQuery, useTheme } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useCallback, useMemo } from 'react'
import * as echarts from 'echarts'
import { EChartsWrapper } from '@/shared/components/common'
import { ChartEmptyState } from '@/shared/components/common/chart-empty-state'
import {
  getBodyText7Style,
  resolveThemeColorToken,
} from '@/shared/components/charts/chart-text-style'
import {
  getSchemeStatusChartColorToken,
  resolveSchemeStatusLabel,
} from '@/shared/constants/scheme-status'
import type { SchemeStatusCount, SchemeStatusDimension } from '@/shared/constants/scheme-status'

interface SchemeStatusDonutChartProps {
  dimension: SchemeStatusDimension
  data: SchemeStatusCount[]
  className?: string
  height?: string | number
}

const donutRadius: [string, string] = ['58%', '98%']
const donutCenter: [string, string] = ['50%', '50%']

export function SchemeStatusDonutChart({
  dimension,
  data,
  className,
  height = '360px',
}: SchemeStatusDonutChartProps) {
  const { t } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')
  const theme = useTheme()
  const [isBelowXs] = useMediaQuery('(max-width: 480px)')
  const bodyText7 = getBodyText7Style(theme)
  const noDataLabel = tCommon('noDataAvailable', { defaultValue: 'No data available' })

  const labelForBucket = useCallback(
    (bucket: SchemeStatusCount) => resolveSchemeStatusLabel(t, dimension, bucket),
    [t, dimension]
  )
  const colorForBucket = useCallback(
    (bucket: SchemeStatusCount) =>
      resolveThemeColorToken(theme, getSchemeStatusChartColorToken(dimension, bucket.code)),
    [theme, dimension]
  )

  const option = useMemo<echarts.EChartsOption>(() => {
    const total = data.reduce((sum, entry) => sum + entry.count, 0)

    return {
      tooltip: {
        show: true,
        trigger: 'item',
        formatter: (params: unknown) => {
          const point = params as { name?: string; value?: number | string }
          const rawValue =
            typeof point.value === 'number' ? point.value : Number(point.value ?? Number.NaN)
          const hasNumericValue = Number.isFinite(rawValue)
          // The label may originate from a server-supplied fallback for an out-of-vocabulary
          // code, so it must be escaped before landing in tooltip HTML.
          const safeName = echarts.format.encodeHTML(point.name ?? '')
          const percentage =
            hasNumericValue && total > 0 ? ` (${((rawValue / total) * 100).toFixed(1)}%)` : ''
          const formattedValue = hasNumericValue ? String(rawValue) : '-'

          return `<strong>${safeName}</strong><br/>${formattedValue}${percentage}`
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
          data: data.map((bucket) => {
            const color = colorForBucket(bucket)
            return {
              name: labelForBucket(bucket),
              value: bucket.count,
              itemStyle: { color },
              emphasis: { itemStyle: { color } },
            }
          }),
        },
      ],
    }
  }, [data, labelForBucket, colorForBucket])

  const containerHeight = typeof height === 'number' ? `${height}px` : height
  const chartSize = isBelowXs ? 240 : 300
  const legendMarginTop = isBelowXs ? 'auto' : '12px'
  const hasRenderableData = useMemo(
    () => data.some((bucket) => Number.isFinite(bucket.count) && bucket.count > 0),
    [data]
  )
  const legendItems = hasRenderableData
    ? data.map((bucket, index) => ({
        key: `${bucket.code ?? 'unknown'}-${index}`,
        label: labelForBucket(bucket),
        color: colorForBucket(bucket),
      }))
    : []

  if (!hasRenderableData) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          minWidth: 0,
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
          flex: 1,
          minBlockSize: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
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
          <EChartsWrapper option={option} height="100%" />
        </div>
        {legendItems.length > 0 ? (
          <div
            style={{
              marginTop: legendMarginTop,
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
    </div>
  )
}
