import { useCallback, useMemo } from 'react'
import { useTheme } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import * as echarts from 'echarts'
import { EChartsWrapper } from '@/shared/components/common'
import { getBodyText7Style } from '@/shared/components/charts/chart-text-style'
import type { ReadingSubmissionStatusData } from '../../types'

interface ReadingSubmissionStatusChartProps {
  data: ReadingSubmissionStatusData[]
  className?: string
  height?: string | number
  pieSize?: number
}

const defaultColors = ['#3291D1', '#ADD3ED']
const chartLegendGapPx = 20

export function ReadingSubmissionStatusChart({
  data,
  className,
  height = '300px',
  pieSize = 300,
}: ReadingSubmissionStatusChartProps) {
  const { t } = useTranslation('dashboard')
  const theme = useTheme()
  const bodyText7 = getBodyText7Style(theme)
  const localizedLegendLabel = useCallback(
    (label: string) => {
      const normalized = label.trim().toLowerCase()
      if (normalized === 'complaint submission' || normalized === 'complaint submissions') {
        return t('outageAndSubmissionCharts.legend.complaintSubmission', {
          defaultValue: 'Complaint Submissios',
        })
      }
      if (normalized === 'automated submission' || normalized === 'automated submissions') {
        return t('outageAndSubmissionCharts.legend.automatedSubmission', {
          defaultValue: 'Anomalous Submissions',
        })
      }

      return label
    },
    [t]
  )

  const option = useMemo<echarts.EChartsOption>(() => {
    const totalSubmissions = data.reduce((sum, entry) => sum + entry.value, 0)

    return {
      tooltip: {
        show: true,
        trigger: 'item',
        formatter: (params: unknown) => {
          const point = params as { name?: string; value?: number | string }
          const rawValue =
            typeof point.value === 'number' ? point.value : Number(point.value ?? Number.NaN)
          const hasNumericValue = Number.isFinite(rawValue)
          const safeName = echarts.format.encodeHTML(point.name ?? '')
          const percentage =
            hasNumericValue && totalSubmissions > 0
              ? ` (${((rawValue / totalSubmissions) * 100).toFixed(1)}%)`
              : ''
          const formattedValue = hasNumericValue ? rawValue.toFixed(1) : '-'

          return `<strong>${safeName}</strong><br/>${formattedValue}${percentage}`
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
          width: `${pieSize}px`,
          height: `${pieSize}px`,
          maxWidth: '100%',
          margin: '0 auto',
        }}
      >
        <EChartsWrapper option={option} height="100%" />
      </div>
      <div
        style={{
          marginTop: `${chartLegendGapPx}px`,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          paddingTop: '0px',
          flexWrap: 'wrap',
          rowGap: '6px',
        }}
      >
        {data.map((entry, index) => (
          <div key={entry.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              aria-hidden="true"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '2px',
                backgroundColor: defaultColors[index % defaultColors.length],
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
              {localizedLegendLabel(entry.label)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
