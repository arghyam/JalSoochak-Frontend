import { useMemo } from 'react'
import { useTheme } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import * as echarts from 'echarts'
import { EChartsWrapper } from '@/shared/components/common'
import { getBodyText7Style } from '@/shared/components/charts/chart-text-style'

interface HourlySubmissionChartProps {
  /** 24 values, index 0 = 00:00-01:00 IST. */
  submissionsByHour: number[]
  className?: string
  height?: string | number
}

const formatHour = (hour: number) => `${String(hour % 24).padStart(2, '0')}:00`

const formatCount = (value: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)

export function HourlySubmissionChart({
  submissionsByHour,
  className,
  height = '100%',
}: HourlySubmissionChartProps) {
  const { t } = useTranslation('dashboard')
  const theme = useTheme()
  const bodyText7 = getBodyText7Style(theme)

  const option = useMemo<echarts.EChartsOption>(() => {
    const hours = submissionsByHour.map((_, hour) => formatHour(hour))
    const total = submissionsByHour.reduce((sum, value) => sum + value, 0)
    const seriesName = t('outageAndSubmissionCharts.series.submissions', {
      defaultValue: 'Submissions',
    })
    const shareLabel = t('outageAndSubmissionCharts.hourlySubmissions.shareOfTotal', {
      defaultValue: 'Share of total',
    })

    return {
      tooltip: {
        show: true,
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const point = (Array.isArray(params) ? params[0] : params) as
            | { dataIndex?: number; value?: number | string }
            | undefined
          if (!point || typeof point.dataIndex !== 'number') {
            return ''
          }
          const count = Number(point.value) || 0
          const share = total > 0 ? Math.round((count / total) * 100) : 0
          const slot = `${formatHour(point.dataIndex)} - ${formatHour(point.dataIndex + 1)}`
          return (
            `<strong>${echarts.format.encodeHTML(slot)}</strong><br/>` +
            `${echarts.format.encodeHTML(seriesName)}: ${formatCount(count)}<br/>` +
            `${echarts.format.encodeHTML(shareLabel)}: ${share}%`
          )
        },
      },
      grid: { left: 8, right: 16, top: 24, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: hours,
        name: t('outageAndSubmissionCharts.axis.hourOfDay', {
          defaultValue: 'Hour of day (IST)',
        }),
        nameLocation: 'middle',
        nameGap: 44,
        nameTextStyle: { fontSize: bodyText7.fontSize, color: bodyText7.color },
        axisLine: { lineStyle: { color: '#E4E4E7' } },
        axisTick: { show: false },
        axisLabel: {
          rotate: 45,
          interval: 0,
          fontSize: bodyText7.fontSize,
          color: bodyText7.color,
        },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        name: t('outageAndSubmissionCharts.axis.noOfSubmissions', {
          defaultValue: 'No. of submissions',
        }),
        nameLocation: 'middle',
        nameGap: 48,
        nameTextStyle: { fontSize: bodyText7.fontSize, color: bodyText7.color },
        axisLabel: {
          fontSize: bodyText7.fontSize,
          color: bodyText7.color,
          formatter: (value: number) => formatCount(value),
        },
        splitLine: { lineStyle: { color: '#E4E4E7' } },
      },
      series: [
        {
          name: seriesName,
          type: 'bar',
          data: submissionsByHour,
          barCategoryGap: '30%',
          itemStyle: { color: '#3291D1', borderRadius: [6, 6, 0, 0] },
          emphasis: { itemStyle: { color: '#84BDE3' } },
        },
      ],
    }
  }, [bodyText7, submissionsByHour, t])

  return <EChartsWrapper option={option} className={className} height={height} />
}
