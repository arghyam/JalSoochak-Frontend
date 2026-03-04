import { useMemo, useState } from 'react'
import { useTheme } from '@chakra-ui/react'
import * as echarts from 'echarts'
import { useTranslation } from 'react-i18next'
import { EChartsWrapper } from './echarts-wrapper'
import { getBodyText6Style } from './chart-text-style'
import { Toggle } from '@/shared/components/common'
import type { EntityPerformance } from '../../types'

interface IndiaMapChartProps {
  data: EntityPerformance[]
  onStateClick?: (stateId: string, stateName: string) => void
  onStateHover?: (stateId: string, stateName: string, metrics: EntityPerformance) => void
  className?: string
  height?: string | number
}

export function IndiaMapChart({
  data,
  onStateClick,
  onStateHover,
  className,
  height = '600px',
}: IndiaMapChartProps) {
  const theme = useTheme()
  const { t } = useTranslation('dashboard')
  const [isRegularityView, setIsRegularityView] = useState(true)
  const metricKey: 'quantity' | 'regularity' = isRegularityView ? 'regularity' : 'quantity'
  const resolveThemeColor = (token: string) => {
    const [scale, shade] = token.split('.')
    const palette = (theme as { colors?: Record<string, Record<string, string>> }).colors?.[scale]
    const value = palette?.[shade]
    return typeof value === 'string' ? value : token
  }
  const mapColors = {
    gte90: resolveThemeColor('primary.500'),
    gte70: resolveThemeColor('success.500'),
    gte50: resolveThemeColor('secondary.500'),
    gte30: resolveThemeColor('secondary.700'),
    gte0: resolveThemeColor('error.500'),
    noData: resolveThemeColor('neutral.400'),
    emphasis: resolveThemeColor('primary.600'),
  }
  const toggleLabelColor = resolveThemeColor('neutral.950')

  const option = useMemo<echarts.EChartsOption>(() => {
    // Create map data series
    const mapSeries = data.map((state) => ({
      name: state.name,
      value: state[metricKey],
      stateId: state.id,
      status: state.status,
      metrics: {
        coverage: state.coverage,
        regularity: state.regularity,
        continuity: state.continuity,
        quantity: state.quantity,
      },
    }))

    return {
      backgroundColor: '#FAFAFA',
      title: {
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as {
            data?: {
              name: string
              value: number
              metrics: {
                coverage: number
                regularity: number
                continuity: number
                quantity: number
              }
            }
          }
          if (p.data) {
            const { name, value, metrics } = p.data
            return `
              <div style="padding: 8px;">
                <strong>${name}</strong><br/>
                ${metricKey === 'regularity' ? t('map.metric.regularity') : t('map.metric.quantity')}: ${value.toFixed(1)}${metricKey === 'regularity' ? '%' : ''}<br/>
                Coverage: ${metrics.coverage.toFixed(1)}%<br/>
                Regularity: ${metrics.regularity.toFixed(1)}%<br/>
                Continuity: ${metrics.continuity.toFixed(1)}<br/>
                Quantity: ${metrics.quantity} LPCD
              </div>
            `
          }
          return (p as { name?: string }).name || ''
        },
      },
      series: [
        {
          name: 'State Performance',
          type: 'map',
          map: 'india', // Requires India GeoJSON to be registered via registerIndiaMap()
          roam: true,
          // Note: If map is not registered, ECharts will show an error
          // Register the map using: registerIndiaMap(geoJsonData) from utils/map-registry
          label: {
            show: true,
            fontSize: 10,
          },
          data: mapSeries,
          itemStyle: {
            areaColor: mapColors.gte90,
            borderColor: '#fff',
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              areaColor: mapColors.emphasis,
              borderWidth: 2,
            },
            label: {
              fontSize: 12,
              fontWeight: 'bold',
            },
          },
        },
      ],
    }
  }, [data, mapColors.emphasis, mapColors.gte90, metricKey, t])

  const bodyText6 = getBodyText6Style(theme)
  const legendItems = [
    { label: t('map.legend.gte90'), color: mapColors.gte90 },
    { label: t('map.legend.gte70'), color: mapColors.gte70 },
    { label: t('map.legend.gte50'), color: mapColors.gte50 },
    { label: t('map.legend.gte30'), color: mapColors.gte30 },
    { label: t('map.legend.gte0'), color: mapColors.gte0 },
    { label: t('map.legend.noData'), color: mapColors.noData },
  ]

  const containerHeight = typeof height === 'number' ? `${height}px` : height

  const handleChartReady = (chart: echarts.ECharts) => {
    // Register click event
    chart.on('click', (params: unknown) => {
      const p = params as {
        data?: {
          stateId: string
          name: string
        }
      }
      if (p.data?.stateId && onStateClick) {
        onStateClick(p.data.stateId, p.data.name)
      }
    })

    // Register hover event
    chart.on('mouseover', (params: unknown) => {
      const p = params as {
        data?: {
          stateId: string
          name: string
        }
      }
      if (p.data?.stateId && onStateHover) {
        const stateData = data.find((d) => d.id === p.data?.stateId) ?? undefined
        if (stateData) {
          onStateHover(p.data.stateId, p.data.name, stateData)
        }
      }
    })
  }

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
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '16px',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '10px',
            }}
          >
            <span
              style={{
                fontSize: bodyText6.fontSize,
                lineHeight: `${bodyText6.lineHeight}px`,
                fontWeight: 400,
                color: toggleLabelColor,
              }}
            >
              {t('map.metric.quantity')}
            </span>
            <Toggle
              isChecked={isRegularityView}
              onChange={(event) => {
                setIsRegularityView(event.target.checked)
              }}
            />
            <span
              style={{
                fontSize: bodyText6.fontSize,
                lineHeight: `${bodyText6.lineHeight}px`,
                fontWeight: 400,
                color: toggleLabelColor,
              }}
            >
              {t('map.metric.regularity')}
            </span>
          </div>
          <EChartsWrapper option={option} height="100%" onChartReady={handleChartReady} />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          paddingTop: '8px',
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
                fontSize: bodyText6.fontSize,
                lineHeight: `${bodyText6.lineHeight}px`,
                fontWeight: bodyText6.fontWeight,
                color: bodyText6.color,
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
