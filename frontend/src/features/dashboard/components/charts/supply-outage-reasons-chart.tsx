import { useMemo } from 'react'
import { useTheme } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import * as echarts from 'echarts'
import { EChartsWrapper } from '@/shared/components/common'
import { getBodyText7Style } from '@/shared/components/charts/chart-text-style'
import type { WaterSupplyOutageData } from '../../types'

interface SupplyOutageReasonsChartProps {
  data: WaterSupplyOutageData[]
  className?: string
  height?: string | number
  pieSize?: number
}

const outageColors = {
  electricityFailure: '#D6E9F6',
  pipelineLeak: '#ADD3ED',
  pumpFailure: '#84BDE3',
  valveIssue: '#3291D1',
  sourceDrying: '#1E577D',
}
const chartLegendGapPx = 20

export function SupplyOutageReasonsChart({
  data,
  className,
  height = '300px',
  pieSize = 300,
}: SupplyOutageReasonsChartProps) {
  const { t } = useTranslation('dashboard')
  const theme = useTheme()
  const bodyText7 = getBodyText7Style(theme)
  const legendLabels = useMemo(
    () => ({
      electricalFailure: t('outageAndSubmissionCharts.legend.electricalFailure', {
        defaultValue: 'Electrical failure',
      }),
      pipelineBreak: t('outageAndSubmissionCharts.legend.pipelineBreak', {
        defaultValue: 'Pipeline break',
      }),
      pumpFailure: t('outageAndSubmissionCharts.legend.pumpFailure', {
        defaultValue: 'Pump failure',
      }),
      valveIssue: t('outageAndSubmissionCharts.legend.valveIssue', { defaultValue: 'Valve issue' }),
      sourceDrying: t('outageAndSubmissionCharts.legend.sourceDrying', {
        defaultValue: 'Source Drying',
      }),
    }),
    [t]
  )

  const totals = useMemo(
    () =>
      data.reduce(
        (acc, entry) => ({
          electricityFailure: acc.electricityFailure + entry.electricityFailure,
          pipelineLeak: acc.pipelineLeak + entry.pipelineLeak,
          pumpFailure: acc.pumpFailure + entry.pumpFailure,
          valveIssue: acc.valveIssue + entry.valveIssue,
          sourceDrying: acc.sourceDrying + entry.sourceDrying,
        }),
        {
          electricityFailure: 0,
          pipelineLeak: 0,
          pumpFailure: 0,
          valveIssue: 0,
          sourceDrying: 0,
        }
      ),
    [data]
  )

  const option = useMemo<echarts.EChartsOption>(() => {
    const totalOutages =
      totals.electricityFailure +
      totals.pipelineLeak +
      totals.pumpFailure +
      totals.valveIssue +
      totals.sourceDrying

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
          data: [
            {
              name: legendLabels.electricalFailure,
              value: totals.electricityFailure,
              itemStyle: { color: outageColors.electricityFailure },
              emphasis: { itemStyle: { color: outageColors.electricityFailure } },
            },
            {
              name: legendLabels.pipelineBreak,
              value: totals.pipelineLeak,
              itemStyle: { color: outageColors.pipelineLeak },
              emphasis: { itemStyle: { color: outageColors.pipelineLeak } },
            },
            {
              name: legendLabels.pumpFailure,
              value: totals.pumpFailure,
              itemStyle: { color: outageColors.pumpFailure },
              emphasis: { itemStyle: { color: outageColors.pumpFailure } },
            },
            {
              name: legendLabels.valveIssue,
              value: totals.valveIssue,
              itemStyle: { color: outageColors.valveIssue },
              emphasis: { itemStyle: { color: outageColors.valveIssue } },
            },
            {
              name: legendLabels.sourceDrying,
              value: totals.sourceDrying,
              itemStyle: { color: outageColors.sourceDrying },
              emphasis: { itemStyle: { color: outageColors.sourceDrying } },
            },
          ],
        },
      ],
    }
  }, [legendLabels, totals])

  const containerHeight = typeof height === 'number' ? `${height}px` : height
  const legendItems = [
    { label: legendLabels.electricalFailure, color: outageColors.electricityFailure },
    { label: legendLabels.pipelineBreak, color: outageColors.pipelineLeak },
    { label: legendLabels.pumpFailure, color: outageColors.pumpFailure },
    { label: legendLabels.valveIssue, color: outageColors.valveIssue },
    { label: legendLabels.sourceDrying, color: outageColors.sourceDrying },
  ]

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
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
    </div>
  )
}
