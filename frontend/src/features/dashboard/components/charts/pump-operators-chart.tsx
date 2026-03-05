import { useCallback, useMemo } from 'react'
import { useBreakpointValue, useTheme } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import * as echarts from 'echarts'
import { EChartsWrapper } from '@/shared/components/common'
import { getBodyText7Style } from '@/shared/components/charts/chart-text-style'
import type { PumpOperatorsData } from '../../types'

interface PumpOperatorsChartProps {
  data: PumpOperatorsData[]
  className?: string
  height?: string | number
  note?: string
}

const defaultColors = ['#3291D1', '#ADD3ED']
const defaultPieRadius: (string | number)[] = ['50%', '85%']
const defaultPieCenter: [string, string] = ['50%', '45%']
const legendKeyByNormalizedLabel: Record<string, 'active' | 'inactive'> = {
  active: 'active',
  'active pump operator': 'active',
  'active pump operators': 'active',
  inactive: 'inactive',
  'inactive pump operator': 'inactive',
  'inactive pump operators': 'inactive',
  'non active pump operator': 'inactive',
  'non active pump operators': 'inactive',
}

const normalizeLegendLabel = (label: string) =>
  label.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')

export function PumpOperatorsChart({
  data,
  className,
  height = '360px',
  note,
}: PumpOperatorsChartProps) {
  const { t } = useTranslation('dashboard')
  const theme = useTheme()
  const bodyText7 = getBodyText7Style(theme)
  const noteColor = theme?.colors?.neutral?.['950'] ?? bodyText7.color ?? '#667085'
  const pieRadius =
    useBreakpointValue<(string | number)[]>({
      base: ['50%', '75%'],
      sm: ['50%', '85%'],
      md: ['50%', '85%'],
    }) ?? defaultPieRadius
  const pieCenter =
    useBreakpointValue<[string, string]>({
      base: ['50%', '42%'],
      sm: ['50%', '45%'],
      md: ['50%', '45%'],
    }) ?? defaultPieCenter
  const localizedLegendLabel = useCallback(
    (label: string) => {
      const legendKey = legendKeyByNormalizedLabel[normalizeLegendLabel(label)]
      if (legendKey === 'active') {
        return t('pumpOperators.legend.active', { defaultValue: 'Active pump operators' })
      }
      if (legendKey === 'inactive') {
        return t('pumpOperators.legend.inactive', { defaultValue: 'Non-active pump operators' })
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
          startAngle: 360,
          clockwise: true,
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
  const chartSize = 300

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
          width: '100%',
          maxWidth: '594px',
          height: '336px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: `${chartSize}px`,
            height: `${chartSize}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <EChartsWrapper option={option} height="100%" />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            width: '100%',
          }}
        >
          {data.map((entry, index) => (
            <div
              key={`${entry.label}-${index}`}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
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
      {note ? (
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
