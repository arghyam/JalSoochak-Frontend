import { useCallback, useMemo } from 'react'
import { useBreakpointValue, useTheme } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import * as echarts from 'echarts'
import { EChartsWrapper } from '@/shared/components/common'
import { getBodyText7Style } from '@/shared/components/charts/chart-text-style'
import type { ImageSubmissionStatusData } from '../../types'

interface ImageSubmissionStatusChartProps {
  data: ImageSubmissionStatusData[]
  className?: string
  height?: string | number
}

const defaultColors = ['#3291D1', '#ADD3ED']
const defaultPieRadius: (string | number)[] = ['0%', '68%']
const defaultPieCenter: [string, string] = ['50%', '45%']

export function ImageSubmissionStatusChart({
  data,
  className,
  height = '406px',
}: ImageSubmissionStatusChartProps) {
  const { t } = useTranslation('dashboard')
  const theme = useTheme()
  const bodyText7 = getBodyText7Style(theme)
  const pieRadius =
    useBreakpointValue<(string | number)[]>({
      base: ['0%', '75%'],
      sm: ['0%', '70%'],
      md: ['0%', '68%'],
    }) ?? defaultPieRadius
  const pieCenter =
    useBreakpointValue<[string, string]>({
      base: ['50%', '42%'],
      sm: ['50%', '45%'],
      md: ['50%', '45%'],
    }) ?? defaultPieCenter
  const localizedLegendLabel = useCallback(
    (label: string) => {
      const normalized = label.trim().toLowerCase()
      if (normalized === 'complaint submission' || normalized === 'compliant submissions') {
        return t('outageAndSubmissionCharts.legend.complaintSubmission', {
          defaultValue: 'Complaint Submission',
        })
      }
      if (normalized === 'automated submission' || normalized === 'automated submissions') {
        return t('outageAndSubmissionCharts.legend.automatedSubmission', {
          defaultValue: 'Automated Submission',
        })
      }

      return label
    },
    [t]
  )

  const option = useMemo<echarts.EChartsOption>(() => {
    return {
      tooltip: {
        show: false,
      },
      series: [
        {
          type: 'pie',
          radius: pieRadius,
          center: pieCenter,
          avoidLabelOverlap: true,
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
          })),
        },
      ],
    }
  }, [data, pieCenter, pieRadius, localizedLegendLabel])

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
      }}
    >
      <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <EChartsWrapper option={option} height="100%" />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          paddingTop: '8px',
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
