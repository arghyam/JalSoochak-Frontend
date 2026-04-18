import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import { getRuntimeConfig } from '@/config/runtime-config'
import type { EntityPerformance } from '../../types'
import { slugify } from '../../utils/format-location-label'
import {
  buildFeatureCollectionFromRegions,
  INDIA_NATIONAL_BOUNDARY_FEATURE_NAME,
  PARENT_BOUNDARY_FEATURE_NAME,
  PARENT_BOUNDARY_FILL_FEATURE_NAME,
  registerDynamicMap,
} from '../../utils/map-registry'

interface IndiaMapChartProps {
  data: EntityPerformance[]
  tooltipData?: EntityPerformance[]
  nationalBoundaryGeoJson?: EntityPerformance['boundaryGeoJson']
  parentBoundaryGeoJson?: EntityPerformance['boundaryGeoJson']
  isLoading?: boolean
  onStateClick?: (stateId: string, stateName: string) => void
  onStateHover?: (stateId: string, stateName: string, metrics: EntityPerformance) => void
  quantityViewUnit?: 'percent' | 'mld'
  className?: string
  height?: string | number
  mapName?: string
  usePrimaryFill?: boolean
  disableHoverEffect?: boolean
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
  isRegularityView?: boolean
  onRegularityViewChange?: (next: boolean) => void
  hoveredRegion?: EntityPerformance | null
}

export function IndiaMapChart({
  data,
  tooltipData,
  nationalBoundaryGeoJson,
  parentBoundaryGeoJson,
  isLoading = false,
  onStateClick,
  onStateHover,
  quantityViewUnit = 'percent',
  className,
  height = '600px',
  mapName = 'india',
  usePrimaryFill = false,
  disableHoverEffect = false,
  isFullscreen = false,
  onFullscreenToggle,
  isRegularityView: controlledIsRegularityView,
  onRegularityViewChange,
  hoveredRegion = null,
}: IndiaMapChartProps) {
  const theme = useTheme()
  const [isBelow500] = useMediaQuery('(max-width: 499.98px)')
  const [isBelowSm] = useMediaQuery('(max-width: 479.98px)')
  const { t } = useTranslation('dashboard')
  const dynamicGeoJson = useMemo(
    () =>
      buildFeatureCollectionFromRegions(data, {
        nationalBoundaryGeoJson,
        parentBoundaryGeoJson,
      }),
    [data, nationalBoundaryGeoJson, parentBoundaryGeoJson]
  )
  const [internalIsRegularityView, setInternalIsRegularityView] = useState(true)
  const isRegularityView = controlledIsRegularityView ?? internalIsRegularityView
  const metricKey: 'quantity' | 'regularity' = isRegularityView ? 'regularity' : 'quantity'
  // Retained for API compatibility; map hover tooltip now always displays Quantity in LPCD.
  void quantityViewUnit
  const shouldShowNoMapAvailable = !isLoading && !dynamicGeoJson
  const effectiveMapName = mapName
  const isRegisteredMapAvailable =
    dynamicGeoJson != null || (mapName != null && echarts.getMap(mapName) != null)
  const isMapReady = !isLoading && !shouldShowNoMapAvailable && isRegisteredMapAvailable
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
      gte90: resolveThemeColor('#5DBA52'),
      gte70: resolveThemeColor('#89E57F'),
      gte50: resolveThemeColor('#FFB433'),
      gte30: resolveThemeColor('#FFD999'),
      gte0: resolveThemeColor('#F4614F'),
      noData: resolveThemeColor('#D1D1D6'),
    }),
    [resolveThemeColor]
  )
  const hoverColors = useMemo(
    () => ({
      // Manual placeholders: set your own hover colors per legend bucket.
      // Example: gte90: '#84BDE3'
      gte90: '#38962C',
      gte70: '#33BA11',
      gte50: '#CC8100',
      gte30: '#EB932D',
      gte0: '#C74331',
      noData: '#A0A0AB',
    }),
    []
  )
  const primaryMapColor = resolveThemeColor('primary.500')
  const quantityLabel = t('map.metric.quantity', { defaultValue: 'Quantity' })
  const quantityLpcdLabel = t('overallPerformance.columns.quantityLpcd', {
    defaultValue: 'Quantity (LPCD)',
  })
  const regularityLabel = t('map.metric.regularity', { defaultValue: 'Regularity' })
  const selectedMetricLabel = isRegularityView ? regularityLabel : quantityLabel
  const resolveLegendThreshold = useCallback(
    (raw: string | number | undefined, fallback: number) => {
      const parsed = Number(raw)
      return Number.isFinite(parsed) ? parsed : fallback
    },
    []
  )
  const runtimeConfig = useMemo(() => getRuntimeConfig(), [])
  const legendThresholds = useMemo(
    () => ({
      gte90: resolveLegendThreshold(runtimeConfig.MAP_LEGEND_THRESHOLD_GTE_90, 90),
      gte70: resolveLegendThreshold(runtimeConfig.MAP_LEGEND_THRESHOLD_GTE_70, 70),
      gte50: resolveLegendThreshold(runtimeConfig.MAP_LEGEND_THRESHOLD_GTE_50, 50),
      gte30: resolveLegendThreshold(runtimeConfig.MAP_LEGEND_THRESHOLD_GTE_30, 30),
      gte0: resolveLegendThreshold(runtimeConfig.MAP_LEGEND_THRESHOLD_GTE_0, 0),
    }),
    [resolveLegendThreshold, runtimeConfig]
  )
  const getRangeColor = useCallback(
    (value: number) => {
      if (!Number.isFinite(value) || value < 0) return mapColors.noData
      if (value >= legendThresholds.gte90) return mapColors.gte90
      if (value >= legendThresholds.gte70) return mapColors.gte70
      if (value >= legendThresholds.gte50) return mapColors.gte50
      if (value >= legendThresholds.gte30) return mapColors.gte30
      if (value >= legendThresholds.gte0) return mapColors.gte0
      return mapColors.noData
    },
    [legendThresholds, mapColors]
  )
  const resolveAreaColor = useCallback(
    (value: number) => (usePrimaryFill ? primaryMapColor : getRangeColor(value)),
    [getRangeColor, primaryMapColor, usePrimaryFill]
  )
  const getHoverRangeColor = useCallback(
    (value: number) => {
      if (!Number.isFinite(value) || value < 0) return hoverColors.noData || mapColors.noData
      if (value >= legendThresholds.gte90) return hoverColors.gte90 || mapColors.gte90
      if (value >= legendThresholds.gte70) return hoverColors.gte70 || mapColors.gte70
      if (value >= legendThresholds.gte50) return hoverColors.gte50 || mapColors.gte50
      if (value >= legendThresholds.gte30) return hoverColors.gte30 || mapColors.gte30
      if (value >= legendThresholds.gte0) return hoverColors.gte0 || mapColors.gte0
      return hoverColors.noData || mapColors.noData
    },
    [hoverColors, legendThresholds, mapColors]
  )
  const hasInteractiveMetricValue = useCallback(
    (value: number) => Number.isFinite(value) && value >= 0,
    []
  )

  const option = useMemo<echarts.EChartsOption>(() => {
    const hasParentBoundaryFeature = Boolean(
      dynamicGeoJson?.features.some(
        (feature) => feature.properties?.name === PARENT_BOUNDARY_FEATURE_NAME
      )
    )
    const hasParentBoundaryFillFeature = Boolean(
      dynamicGeoJson?.features.some(
        (feature) => feature.properties?.name === PARENT_BOUNDARY_FILL_FEATURE_NAME
      )
    )

    // Create map data series
    const boundaryFillOverlays = [
      ...(hasParentBoundaryFillFeature
        ? [
            {
              name: PARENT_BOUNDARY_FILL_FEATURE_NAME,
              value: -1,
              silent: true,
              tooltip: { show: false },
              label: { show: false },
              itemStyle: {
                areaColor: mapColors.noData,
                borderColor: 'rgba(0,0,0,0)',
                borderWidth: 0,
              },
              emphasis: {
                disabled: true,
                label: { show: false },
                itemStyle: {
                  areaColor: mapColors.noData,
                  borderColor: 'rgba(0,0,0,0)',
                  borderWidth: 0,
                },
              },
              select: {
                disabled: true,
                label: { show: false },
                itemStyle: {
                  areaColor: mapColors.noData,
                  borderColor: 'rgba(0,0,0,0)',
                  borderWidth: 0,
                },
              },
            },
          ]
        : []),
    ]
    const hoveredRegionId = hoveredRegion?.id?.trim()
    const hoveredRegionName = hoveredRegion ? slugify(hoveredRegion.name) : ''
    const tooltipDataById = new Map(
      (tooltipData ?? [])
        .map((region) => [region.id?.trim(), region] as const)
        .filter(([id]) => Boolean(id))
    )
    const tooltipDataBySlugName = new Map(
      (tooltipData ?? []).map((region) => [slugify(region.name), region] as const)
    )
    const mapSeries = data.map((state) => {
      const hasInteractiveMetric = hasInteractiveMetricValue(state[metricKey])
      const stateId = state.id?.trim()
      const stateName = slugify(state.name)
      const tooltipSourceRegion =
        (stateId ? tooltipDataById.get(stateId) : undefined) ?? tooltipDataBySlugName.get(stateName)
      const isExternallyHovered = Boolean(
        hoveredRegion &&
        ((hoveredRegionId && stateId && hoveredRegionId === stateId) ||
          (hoveredRegionName && hoveredRegionName === stateName))
      )
      const defaultAreaColor = resolveAreaColor(state[metricKey])
      const hoverAreaColor = getHoverRangeColor(state[metricKey])
      const effectiveAreaColor =
        isExternallyHovered && hasInteractiveMetric ? hoverAreaColor : defaultAreaColor

      return {
        name: state.name,
        value: state[metricKey],
        stateId: state.id,
        status: state.status,
        itemStyle: {
          areaColor: effectiveAreaColor,
          borderColor: isExternallyHovered ? '#51525c' : undefined,
          borderWidth: isExternallyHovered ? 1 : undefined,
        },
        emphasis:
          disableHoverEffect || !hasInteractiveMetric
            ? {
                disabled: true,
                itemStyle: {
                  areaColor: defaultAreaColor,
                },
              }
            : {
                itemStyle: {
                  areaColor: hoverAreaColor,
                },
              },
        select: {
          itemStyle: {
            areaColor:
              disableHoverEffect || !hasInteractiveMetric ? defaultAreaColor : hoverAreaColor,
          },
        },
        metrics: {
          coverage: state.coverage,
          regularity: state.regularity,
          continuity: state.continuity,
          quantity: state.quantity,
          quantityLpcd: tooltipSourceRegion?.quantity ?? state.quantity,
        },
      }
    })
    const boundaryOverlays = [
      ...(nationalBoundaryGeoJson
        ? [
            {
              name: INDIA_NATIONAL_BOUNDARY_FEATURE_NAME,
              value: -1,
              silent: true,
              tooltip: { show: false },
              label: { show: false },
              itemStyle: {
                areaColor: 'rgba(0,0,0,0)',
                borderColor: '#51525c',
                borderWidth: 1.5,
              },
              emphasis: {
                disabled: true,
                label: { show: false },
                itemStyle: {
                  areaColor: 'rgba(0,0,0,0)',
                  borderColor: '#51525c',
                  borderWidth: 1.5,
                },
              },
              select: {
                disabled: true,
                label: { show: false },
                itemStyle: {
                  areaColor: 'rgba(0,0,0,0)',
                  borderColor: '#51525c',
                  borderWidth: 1.5,
                },
              },
            },
          ]
        : []),
      ...(hasParentBoundaryFeature
        ? [
            {
              name: PARENT_BOUNDARY_FEATURE_NAME,
              value: -1,
              silent: true,
              tooltip: { show: false },
              label: { show: false },
              itemStyle: {
                areaColor: 'rgba(0,0,0,0)',
                borderColor: '#51525c',
                borderWidth: 1,
              },
              emphasis: {
                disabled: true,
                label: { show: false },
                itemStyle: {
                  areaColor: 'rgba(0,0,0,0)',
                  borderColor: '#000000',
                  borderWidth: 1,
                },
              },
              select: {
                disabled: true,
                label: { show: false },
                itemStyle: {
                  areaColor: 'rgba(0,0,0,0)',
                  borderColor: '#000000',
                  borderWidth: 1,
                },
              },
            },
          ]
        : []),
    ]
    const seriesData = [...boundaryFillOverlays, ...mapSeries, ...boundaryOverlays]

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
                quantityLpcd?: number
              }
            }
          }
          if (p.data) {
            if (
              p.data.name === INDIA_NATIONAL_BOUNDARY_FEATURE_NAME ||
              p.data.name === PARENT_BOUNDARY_FEATURE_NAME ||
              p.data.name === PARENT_BOUNDARY_FILL_FEATURE_NAME
            ) {
              return ''
            }
            const { name, metrics } = p.data
            const safeName = echarts.format.encodeHTML(name)
            const formatPercent = (value: number) =>
              Number.isFinite(value) && value >= 0 ? `${value.toFixed(1)}%` : 'N/A'
            const formatLpcd = (value: number) =>
              Number.isFinite(value) && value >= 0 ? `${value.toFixed(1)}` : 'N/A'
            return `
              <div style="padding: 8px;">
                <strong>${safeName}</strong><br/>
                ${regularityLabel}: ${formatPercent(metrics.regularity)}<br/>
                ${quantityLpcdLabel}: ${formatLpcd(metrics.quantityLpcd ?? metrics.quantity)}
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
          roam: isFullscreen ? 'scale' : false,
          aspectScale: 0.927,
          scaleLimit: {
            min: 1.2,
            max: 4,
          },
          label: {
            show: false,
            fontSize: 10,
            color: '#51525c',
            opacity: 1,
          },
          labelLayout: {
            hideOverlap: false,
            moveOverlap: 'shiftY',
          },
          data: seriesData,
          itemStyle: {
            areaColor: usePrimaryFill ? primaryMapColor : mapColors.gte90,
            borderColor: '#51525c',
            borderWidth: 0.6,
            opacity: 1,
          },
          selectedMode: 'single',
          emphasis: disableHoverEffect
            ? {
                disabled: true,
                label: {
                  show: false,
                  color: '#51525c',
                  opacity: 1,
                },
              }
            : {
                focus: 'none',
                itemStyle: {
                  borderColor: '#51525c',
                  borderWidth: 0.5,
                  opacity: 1,
                },
                label: {
                  show: false,
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: '#51525c',
                  opacity: 1,
                },
              },
          select: {
            itemStyle: {
              borderColor: '#51525c',
              borderWidth: 0.5,
              opacity: 1,
            },
            label: {
              show: false,
              fontSize: 12,
              fontWeight: 'bold',
              color: '#51525c',
              opacity: 1,
            },
          },
          blur: {
            itemStyle: {
              opacity: 1,
            },
            label: {
              opacity: 1,
              color: '#51525c',
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
    quantityLpcdLabel,
    regularityLabel,
    dynamicGeoJson,
    hoveredRegion,
    isFullscreen,
    tooltipData,
  ])

  const bodyText6 = getBodyText6Style(theme)
  const legendItems = [
    { id: 'noData', label: t('map.legend.noData'), color: mapColors.noData },
    {
      id: 'gte0',
      label: t('map.legend.gte0', {
        value: legendThresholds.gte0,
        defaultValue: `>=${legendThresholds.gte0}%`,
      }),
      color: mapColors.gte0,
    },
    {
      id: 'gte30',
      label: t('map.legend.gte30', {
        value: legendThresholds.gte30,
        defaultValue: `>=${legendThresholds.gte30}%`,
      }),
      color: mapColors.gte30,
    },
    {
      id: 'gte50',
      label: t('map.legend.gte50', {
        value: legendThresholds.gte50,
        defaultValue: `>=${legendThresholds.gte50}%`,
      }),
      color: mapColors.gte50,
    },
    {
      id: 'gte70',
      label: t('map.legend.gte70', {
        value: legendThresholds.gte70,
        defaultValue: `>=${legendThresholds.gte70}%`,
      }),
      color: mapColors.gte70,
    },
    {
      id: 'gte90',
      label: t('map.legend.gte90', {
        value: legendThresholds.gte90,
        defaultValue: `>=${legendThresholds.gte90}%`,
      }),
      color: mapColors.gte90,
    },
  ]

  const containerHeight = typeof height === 'number' ? `${height}px` : height
  const fullscreenActionLabel = t(
    isFullscreen ? 'map.actions.exitFullscreen' : 'map.actions.fullscreen',
    {
      defaultValue: isFullscreen ? 'Exit fullscreen map' : 'Show fullscreen map',
    }
  )

  const onStateClickRef = useRef(onStateClick)
  const onStateHoverRef = useRef(onStateHover)
  const dataRef = useRef(data)

  useLayoutEffect(() => {
    onStateClickRef.current = onStateClick
    onStateHoverRef.current = onStateHover
    dataRef.current = data
  })

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
            value: number
          }
        }
        if (p.data?.stateId && hasInteractiveMetricValue(p.data.value) && onStateClickRef.current) {
          onStateClickRef.current(p.data.stateId, p.data.name)
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
          if (p.data?.stateId && onStateHoverRef.current) {
            const stateData = dataRef.current.find((d) => d.id === p.data?.stateId)
            if (stateData) {
              onStateHoverRef.current(p.data.stateId, p.data.name, stateData)
            }
          }
        })
      }
    },
    [disableHoverEffect, hasInteractiveMetricValue]
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
                opacity: isRegularityView ? 0.45 : 1,
                transition: 'opacity 0.2s ease',
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
                  const nextValue = event.target.checked
                  if (controlledIsRegularityView === undefined) {
                    setInternalIsRegularityView(nextValue)
                  }
                  onRegularityViewChange?.(nextValue)
                }}
              />
            </div>
            <span
              style={{
                fontSize: isBelowSm ? '12px' : bodyText6.fontSize,
                lineHeight: isBelowSm ? '16px' : `${bodyText6.lineHeight}px`,
                fontWeight: bodyText6.fontWeight,
                color: bodyText6.color,
                opacity: isRegularityView ? 1 : 0.45,
                transition: 'opacity 0.2s ease',
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
        role="list"
        aria-label={t('map.legend.ariaLabel', { defaultValue: 'Map value ranges' })}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          justifyContent: 'center',
          columnGap: '4px',
          rowGap: '4px',
          paddingTop: '10px',
          paddingBottom: '2px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        {legendItems.map((item) => (
          <div
            key={item.id}
            role="listitem"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: '4px',
              flex: isBelow500 ? '1 1 calc((100% - 8px) / 3)' : '1 1 0',
              minWidth: isBelow500 ? 'calc((100% - 8px) / 3)' : 0,
              maxWidth: isBelow500 ? 'calc((100% - 8px) / 3)' : undefined,
            }}
          >
            <span
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: isBelowSm ? '11px' : bodyText6.fontSize,
                lineHeight: isBelowSm ? '14px' : `${bodyText6.lineHeight}px`,
                fontWeight: bodyText6.fontWeight,
                color: bodyText6.color,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.label}
            </span>
            <span
              aria-hidden="true"
              style={{
                width: '100%',
                height: '5px',
                borderRadius: '1px',
                backgroundColor: item.color,
                flexShrink: 0,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
