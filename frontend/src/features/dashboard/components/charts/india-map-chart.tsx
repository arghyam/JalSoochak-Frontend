import { useCallback, useLayoutEffect, useMemo, useState } from 'react'
import {
  Center,
  IconButton,
  Spinner,
  Text,
  useMediaQuery,
  useTheme,
  VStack,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import * as echarts from 'echarts'
import { ActionTooltip, EChartsWrapper, Toggle } from '@/shared/components/common'
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi'
import { getBodyText6Style } from '@/shared/components/charts/chart-text-style'
import type { EntityPerformance } from '../../types'
import {
  buildFeatureCollectionFromRegions,
  INDIA_NATIONAL_BOUNDARY_FEATURE_NAME,
  registerDynamicMap,
} from '../../utils/map-registry'

interface IndiaMapChartProps {
  data: EntityPerformance[]
  nationalBoundaryGeoJson?: EntityPerformance['boundaryGeoJson']
  isLoading?: boolean
  onStateClick?: (stateId: string, stateName: string) => void
  onStateHover?: (stateId: string, stateName: string, metrics: EntityPerformance) => void
  className?: string
  height?: string | number
  mapName?: string
  usePrimaryFill?: boolean
  disableHoverEffect?: boolean
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
}

export function IndiaMapChart({
  data,
  nationalBoundaryGeoJson,
  isLoading = false,
  onStateClick,
  onStateHover,
  className,
  height = '600px',
  mapName = 'india',
  usePrimaryFill = false,
  disableHoverEffect = false,
  isFullscreen = false,
  onFullscreenToggle,
}: IndiaMapChartProps) {
  const theme = useTheme()
  const [isBelow500] = useMediaQuery('(max-width: 499.98px)')
  const [isBelowSm] = useMediaQuery('(max-width: 479.98px)')
  const { t } = useTranslation('dashboard')
  const dynamicGeoJson = useMemo(
    () =>
      buildFeatureCollectionFromRegions(data, {
        nationalBoundaryGeoJson,
      }),
    [data, nationalBoundaryGeoJson]
  )
  const [isRegularityView, setIsRegularityView] = useState(true)
  const metricKey: 'quantity' | 'regularity' = isRegularityView ? 'regularity' : 'quantity'
  const shouldShowNoMapAvailable = !isLoading && !dynamicGeoJson
  const effectiveMapName = mapName
  const isRegisteredMapAvailable =
    dynamicGeoJson != null || (mapName != null && echarts.getMap(mapName) != null)
  const isMapReady = !shouldShowNoMapAvailable && isRegisteredMapAvailable
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
    }),
    [resolveThemeColor]
  )
  const hoverColors = useMemo(
    () => ({
      // Manual placeholders: set your own hover colors per legend bucket.
      // Example: gte90: '#84BDE3'
      gte90: '#3291D1',
      gte70: '#38962C',
      gte50: '#FFB433',
      gte30: '#CC8100',
      gte0: '#C73131',
      noData: '#A0A0AB',
    }),
    []
  )
  const primaryMapColor = resolveThemeColor('primary.500')
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
  const resolveAreaColor = useCallback(
    (value: number) => (usePrimaryFill ? primaryMapColor : getRangeColor(value)),
    [getRangeColor, primaryMapColor, usePrimaryFill]
  )
  const getHoverRangeColor = useCallback(
    (value: number) => {
      if (value >= 90) return hoverColors.gte90 || mapColors.gte90
      if (value >= 70) return hoverColors.gte70 || mapColors.gte70
      if (value >= 50) return hoverColors.gte50 || mapColors.gte50
      if (value >= 30) return hoverColors.gte30 || mapColors.gte30
      if (value >= 0) return hoverColors.gte0 || mapColors.gte0
      return hoverColors.noData || mapColors.noData
    },
    [hoverColors, mapColors]
  )

  const option = useMemo<echarts.EChartsOption>(() => {
    const isIndiaMap = (effectiveMapName ?? mapName) === 'india'
    // Create map data series
    const mapSeries = data.map((state) => ({
      name: state.name,
      value: state[metricKey],
      stateId: state.id,
      status: state.status,
      itemStyle: {
        areaColor: resolveAreaColor(state[metricKey]),
      },
      emphasis: disableHoverEffect
        ? undefined
        : {
            itemStyle: {
              areaColor: getHoverRangeColor(state[metricKey]),
            },
          },
      select: {
        itemStyle: {
          areaColor: disableHoverEffect
            ? resolveAreaColor(state[metricKey])
            : getHoverRangeColor(state[metricKey]),
        },
      },
      metrics: {
        coverage: state.coverage,
        regularity: state.regularity,
        continuity: state.continuity,
        quantity: state.quantity,
      },
    }))
    const seriesData = nationalBoundaryGeoJson
      ? [
          {
            name: INDIA_NATIONAL_BOUNDARY_FEATURE_NAME,
            value: -1,
            silent: true,
            tooltip: { show: false },
            label: { show: false },
            itemStyle: {
              areaColor: 'rgba(0,0,0,0)',
              borderColor: '#FFFFFF',
              borderWidth: 1.5,
            },
            emphasis: {
              disabled: true,
              label: { show: false },
              itemStyle: {
                areaColor: 'rgba(0,0,0,0)',
                borderColor: '#FFFFFF',
                borderWidth: 1.5,
              },
            },
            select: {
              disabled: true,
              label: { show: false },
              itemStyle: {
                areaColor: 'rgba(0,0,0,0)',
                borderColor: '#FFFFFF',
                borderWidth: 1.5,
              },
            },
          },
          ...mapSeries,
        ]
      : mapSeries

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
            if (p.data.name === INDIA_NATIONAL_BOUNDARY_FEATURE_NAME) {
              return ''
            }
            const { name, metrics } = p.data
            const safeName = echarts.format.encodeHTML(name)
            const formatPercent = (value: number) =>
              Number.isFinite(value) && value >= 0 ? `${value.toFixed(1)}%` : 'N/A'
            return `
              <div style="padding: 8px;">
                <strong>${safeName}</strong><br/>
                Regularity: ${formatPercent(metrics.regularity)}<br/>
                Quantity: ${formatPercent(metrics.quantity)}
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
          aspectScale: 0.927,
          scaleLimit: {
            min: 1,
            max: 3,
          },
          label: {
            show: true,
            fontSize: 10,
          },
          data: seriesData,
          itemStyle: {
            areaColor: usePrimaryFill ? primaryMapColor : mapColors.gte90,
            borderColor: '#fff',
            borderWidth: 1,
          },
          selectedMode: 'single',
          emphasis: disableHoverEffect
            ? {
                disabled: true,
              }
            : {
                itemStyle: {
                  borderWidth: 2,
                },
                label: {
                  show: !isIndiaMap,
                  fontSize: 12,
                  fontWeight: 'bold',
                },
              },
          select: {
            itemStyle: {
              borderWidth: 2,
            },
            label: {
              show: !isIndiaMap,
              fontSize: 12,
              fontWeight: 'bold',
            },
          },
        },
      ],
    }
  }, [
    data,
    metricKey,
    effectiveMapName,
    mapName,
    primaryMapColor,
    mapColors,
    getHoverRangeColor,
    nationalBoundaryGeoJson,
    resolveAreaColor,
    usePrimaryFill,
    disableHoverEffect,
  ])

  const bodyText6 = getBodyText6Style(theme)
  const legendItems = [
    {
      label: t('map.legend.gte90', { defaultValue: '>=90%' }),
      color: mapColors.gte90,
    },
    {
      label: t('map.legend.gte70', { defaultValue: '>=70%' }),
      color: mapColors.gte70,
    },
    {
      label: t('map.legend.gte50', { defaultValue: '>=50%' }),
      color: mapColors.gte50,
    },
    {
      label: t('map.legend.gte30', { defaultValue: '>=30%' }),
      color: mapColors.gte30,
    },
    {
      label: t('map.legend.gte0', { defaultValue: '>=0%' }),
      color: mapColors.gte0,
    },
    { label: t('map.legend.noData'), color: mapColors.noData },
  ]

  const containerHeight = typeof height === 'number' ? `${height}px` : height
  const fullscreenActionLabel = t(
    isFullscreen ? 'map.actions.exitFullscreen' : 'map.actions.fullscreen',
    {
      defaultValue: isFullscreen ? 'Exit fullscreen map' : 'Show fullscreen map',
    }
  )

  useLayoutEffect(() => {
    if (!dynamicGeoJson) {
      return
    }

    registerDynamicMap(mapName, dynamicGeoJson)
  }, [dynamicGeoJson, mapName])

  const handleChartReady = useCallback(
    (chart: echarts.ECharts) => {
      chart.off('click')
      chart.off('mouseover')

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
      if (!disableHoverEffect) {
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
    },
    [data, disableHoverEffect, onStateClick, onStateHover]
  )

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: containerHeight,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
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
          {onFullscreenToggle ? (
            <div
              style={{
                position: 'absolute',
                right: '8px',
                bottom: '8px',
                zIndex: 3,
              }}
            >
              <ActionTooltip label={fullscreenActionLabel}>
                <IconButton
                  aria-label={fullscreenActionLabel}
                  icon={isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                  size="sm"
                  variant="outline"
                  colorScheme="gray"
                  bg="white"
                  borderColor="#E4E4E7"
                  _hover={{ bg: 'gray.50' }}
                  onClick={onFullscreenToggle}
                />
              </ActionTooltip>
            </div>
          ) : null}
          {isMapReady && isRegisteredMapAvailable ? (
            <EChartsWrapper
              option={option}
              height="100%"
              renderer="svg"
              onChartReady={handleChartReady}
            />
          ) : (
            <Center h="100%">
              <VStack spacing={3}>
                {shouldShowNoMapAvailable ? (
                  <Text color="neutral.600">
                    {t('map.noMapAvailable', {
                      defaultValue: 'Map currently unavailable',
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
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isBelow500 ? '6px 12px' : '0px 16px',
          paddingTop: '8px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        {legendItems.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minWidth: isBelow500 ? 'calc(33.333% - 12px)' : undefined,
              justifyContent: isBelow500 ? 'flex-start' : 'center',
            }}
          >
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
                whiteSpace: 'nowrap',
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
