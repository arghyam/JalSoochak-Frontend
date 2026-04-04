import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Center, Spinner, Text, useMediaQuery, useTheme, VStack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import * as echarts from 'echarts'
import { EChartsWrapper, Toggle } from '@/shared/components/common'
import { getBodyText6Style } from '@/shared/components/charts/chart-text-style'
import type { EntityPerformance } from '../../types'
import {
  buildFeatureCollectionFromRegions,
  ensureIndiaMapRegistered,
  registerDynamicMap,
} from '../../utils/map-registry'

interface IndiaMapChartProps {
  data: EntityPerformance[]
  onStateClick?: (stateId: string, stateName: string) => void
  onStateHover?: (stateId: string, stateName: string, metrics: EntityPerformance) => void
  className?: string
  height?: string | number
  mapName?: string
  fallbackToIndiaMap?: boolean
}

export function IndiaMapChart({
  data,
  onStateClick,
  onStateHover,
  className,
  height = '600px',
  mapName = 'india',
  fallbackToIndiaMap = true,
}: IndiaMapChartProps) {
  const theme = useTheme()
  const [isBelow500] = useMediaQuery('(max-width: 499.98px)')
  const [isBelowSm] = useMediaQuery('(max-width: 479.98px)')
  const { t } = useTranslation('dashboard')
  const dynamicGeoJson = useMemo(() => buildFeatureCollectionFromRegions(data), [data])
  const [isRegularityView, setIsRegularityView] = useState(true)
  const [hasLoadedFallbackMap, setHasLoadedFallbackMap] = useState(false)
  const [mapLoadError, setMapLoadError] = useState(false)
  const metricKey: 'coverage' | 'regularity' = isRegularityView ? 'regularity' : 'coverage'
  const shouldShowNoMapAvailable = !dynamicGeoJson && !fallbackToIndiaMap
  const effectiveMapName = dynamicGeoJson ? mapName : fallbackToIndiaMap ? 'india' : null
  const isRegisteredMapAvailable =
    dynamicGeoJson != null || (effectiveMapName != null && echarts.getMap(effectiveMapName) != null)
  const isMapReady = !shouldShowNoMapAvailable && (isRegisteredMapAvailable || hasLoadedFallbackMap)
  const shouldShowMapLoadError =
    mapLoadError && !dynamicGeoJson && !isRegisteredMapAvailable && !shouldShowNoMapAvailable
  const resolveThemeColor = useCallback(
    (token: string) => {
      const [scale, shade] = token.split('.')
      const palette = (theme as { colors?: Record<string, Record<string, string>> }).colors?.[scale]
      const value = palette?.[shade]
      return typeof value === 'string' ? value : token
    },
    [theme]
  )
  const mapColors = useMemo(
    () => ({
      gte90: resolveThemeColor('#84BDE3'),
      gte70: resolveThemeColor('#5EA955'),
      gte50: resolveThemeColor('#FFD999'),
      gte30: resolveThemeColor('#FFB433'),
      gte0: resolveThemeColor('#FF5C5C'),
      noData: resolveThemeColor('#D1D1D6'),
      emphasis: resolveThemeColor('primary.50'),
    }),
    [resolveThemeColor]
  )
  const quantityLabel = t('map.metric.quantity', { defaultValue: 'Quantity' })
  const regularityLabel = t('map.metric.regularity', { defaultValue: 'Regularity' })
  const selectedMetricLabel = isRegularityView ? regularityLabel : quantityLabel
  const getRangeColor = useCallback(
    (value: number) => {
      if (value >= 90) return mapColors.gte90
      if (value >= 70) return mapColors.gte70
      if (value >= 50) return mapColors.gte50
      if (value >= 30) return mapColors.gte30
      if (value >= 0) return mapColors.gte0
      return mapColors.noData
    },
    [mapColors]
  )

  const option = useMemo<echarts.EChartsOption>(() => {
    // Create map data series
    const mapSeries = data.map((state) => ({
      name: state.name,
      value: state[metricKey],
      stateId: state.id,
      status: state.status,
      itemStyle: {
        areaColor: getRangeColor(state[metricKey]),
      },
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
            const { name, metrics } = p.data
            const safeName = echarts.format.encodeHTML(name)
            return `
              <div style="padding: 8px;">
                <strong>${safeName}</strong><br/>
                Regularity: ${metrics.regularity.toFixed(1)}%<br/>
                Quantity: ${metrics.coverage} MLD
              </div>
            `
          }
          return echarts.format.encodeHTML((p as { name?: string }).name ?? '')
        },
      },
      series: [
        {
          name: 'State Performance',
          type: 'map',
          map: effectiveMapName ?? mapName,
          roam: true,
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
              show: true,
              fontSize: 12,
              fontWeight: 'bold',
            },
          },
        },
      ],
    }
  }, [
    data,
    getRangeColor,
    mapColors.emphasis,
    mapColors.gte90,
    metricKey,
    effectiveMapName,
    mapName,
  ])

  const bodyText6 = getBodyText6Style(theme)
  const legendItems = [
    {
      label: isRegularityView
        ? t('map.legend.gte90', { defaultValue: '>=90%' })
        : t('map.legend.gte90Mld', { defaultValue: '>=90 MLD' }),
      color: mapColors.gte90,
    },
    {
      label: isRegularityView
        ? t('map.legend.gte70', { defaultValue: '>=70%' })
        : t('map.legend.gte70Mld', { defaultValue: '>=70 MLD' }),
      color: mapColors.gte70,
    },
    {
      label: isRegularityView
        ? t('map.legend.gte50', { defaultValue: '>=50%' })
        : t('map.legend.gte50Mld', { defaultValue: '>=50 MLD' }),
      color: mapColors.gte50,
    },
    {
      label: isRegularityView
        ? t('map.legend.gte30', { defaultValue: '>=30%' })
        : t('map.legend.gte30Mld', { defaultValue: '>=30 MLD' }),
      color: mapColors.gte30,
    },
    {
      label: isRegularityView
        ? t('map.legend.gte0', { defaultValue: '>=0%' })
        : t('map.legend.gte0Mld', { defaultValue: '>=0 MLD' }),
      color: mapColors.gte0,
    },
    { label: t('map.legend.noData'), color: mapColors.noData },
  ]

  const containerHeight = typeof height === 'number' ? `${height}px` : height

  useLayoutEffect(() => {
    if (!dynamicGeoJson) {
      return
    }

    registerDynamicMap(mapName, dynamicGeoJson)
  }, [dynamicGeoJson, mapName])

  useEffect(() => {
    let isMounted = true

    const registerMap = async () => {
      if (shouldShowNoMapAvailable || effectiveMapName == null || dynamicGeoJson) {
        return
      }

      const hasRegisteredMap = echarts.getMap(effectiveMapName) != null

      if (hasRegisteredMap) {
        return
      }

      try {
        await ensureIndiaMapRegistered()
        if (isMounted) {
          setHasLoadedFallbackMap(true)
          setMapLoadError(false)
        }
      } catch (error: unknown) {
        console.error('Failed to register India map:', error)
        if (isMounted) {
          setMapLoadError(true)
        }
      }
    }

    void registerMap()

    return () => {
      isMounted = false
    }
  }, [dynamicGeoJson, effectiveMapName, shouldShowNoMapAvailable])

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
            }}
          >
            <span
              style={{
                fontSize: isBelowSm ? '12px' : bodyText6.fontSize,
                lineHeight: isBelowSm ? '16px' : `${bodyText6.lineHeight}px`,
                fontWeight: bodyText6.fontWeight,
                color: bodyText6.color,
              }}
            >
              {quantityLabel}
            </span>
            <div
              style={
                isBelowSm ? { transform: 'scale(0.85)', transformOrigin: 'center' } : undefined
              }
            >
              <Toggle
                isChecked={isRegularityView}
                alwaysPrimaryTrack
                aria-label={t('map.metric.toggleAriaLabel', {
                  defaultValue: 'Switch map metric. Currently selected: {{metric}}',
                  metric: selectedMetricLabel,
                })}
                onChange={(event) => {
                  setIsRegularityView(event.target.checked)
                }}
              />
            </div>
            <span
              style={{
                fontSize: isBelowSm ? '12px' : bodyText6.fontSize,
                lineHeight: isBelowSm ? '16px' : `${bodyText6.lineHeight}px`,
                fontWeight: bodyText6.fontWeight,
                color: bodyText6.color,
              }}
            >
              {regularityLabel}
            </span>
          </div>
          {isMapReady && isRegisteredMapAvailable ? (
            <EChartsWrapper option={option} height="100%" onChartReady={handleChartReady} />
          ) : (
            <Center h="100%">
              <VStack spacing={3}>
                {shouldShowNoMapAvailable ? (
                  <Text color="neutral.600">
                    {t('map.noMapAvailable', {
                      defaultValue: 'Map currently unavailable',
                    })}
                  </Text>
                ) : shouldShowMapLoadError ? (
                  <Text color="neutral.600">
                    {t('map.loadError', {
                      defaultValue: 'Unable to load the map right now.',
                    })}
                  </Text>
                ) : (
                  <>
                    <Spinner size="md" color="primary.500" />
                    <Text color="neutral.600">
                      {t('map.loading', {
                        defaultValue: 'Loading map...',
                      })}
                    </Text>
                  </>
                )}
              </VStack>
            </Center>
          )}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isBelow500 ? 'repeat(3, minmax(0, 1fr))' : 'repeat(6, max-content)',
          alignItems: 'center',
          justifyContent: 'center',
          justifyItems: isBelow500 ? 'start' : 'center',
          columnGap: isBelow500 ? '12px' : '16px',
          rowGap: isBelow500 ? '6px' : '0px',
          paddingTop: '8px',
          width: '100%',
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
