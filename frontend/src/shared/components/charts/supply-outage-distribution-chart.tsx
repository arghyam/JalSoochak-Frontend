import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { Box, useBreakpointValue, useTheme } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import * as echarts from 'echarts'
import { EChartsWrapper } from '@/shared/components/common'
import { formatAxisLabel, formatIsoDateToDayFirst } from './axis-label-format'
import { getBodyText7Style } from './chart-text-style'

export interface WaterSupplyOutageData {
  /** Label shown on the X-axis (state, district, block, sub-division, village, etc.) */
  label: string
  reasons?: Record<string, number>
  electricityFailure: number
  pipelineLeak: number
  pumpFailure: number
  valveIssue: number
  sourceDrying: number
}

interface SupplyOutageDistributionChartProps {
  data: WaterSupplyOutageData[]
  className?: string
  height?: string | number
  xAxisLabel?: string
}

const outageColors = ['#D6E9F6', '#ADD3ED', '#84BDE3', '#3291D1', '#1E577D', '#6BAED6', '#9ECAE1']
const outageReasonTranslationKeys: Record<string, string> = {
  electricityFailure: 'outageAndSubmissionCharts.legend.electricalFailure',
  pipelineLeak: 'outageAndSubmissionCharts.legend.pipelineBreak',
  pumpFailure: 'outageAndSubmissionCharts.legend.pumpFailure',
  valveIssue: 'outageAndSubmissionCharts.legend.valveIssue',
  sourceDrying: 'outageAndSubmissionCharts.legend.sourceDrying',
}

const toDisplayLabel = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (character) => character.toUpperCase())

const getOutageReasonLabel = (
  reasonKey: string,
  t: (key: string, options?: { defaultValue?: string }) => string
) => {
  const translationKey = outageReasonTranslationKeys[reasonKey]
  if (translationKey) {
    return toDisplayLabel(t(translationKey, { defaultValue: toDisplayLabel(reasonKey) }))
  }

  return toDisplayLabel(reasonKey)
}

export function SupplyOutageDistributionChart({
  data,
  className,
  height = '300px',
  xAxisLabel = 'Districts',
}: SupplyOutageDistributionChartProps) {
  const { t } = useTranslation('dashboard')
  const theme = useTheme()
  const bodyText7 = getBodyText7Style(theme)
  const barWidth = useBreakpointValue({ base: 28, sm: 28, md: 42, lg: 66 }) ?? 66
  const barRadius = useBreakpointValue({ base: 8, sm: 10, md: 12 }) ?? 12
  const barCategoryGap = '24px'
  const xAxisLabelMargin = 14
  const chartScrollRef = useRef<HTMLDivElement>(null)
  const scrollbarTrackRef = useRef<HTMLDivElement>(null)
  const scrollbarThumbRef = useRef<HTMLDivElement>(null)
  const isDraggingThumb = useRef(false)
  const dragStartX = useRef(0)
  const dragStartLeft = useRef(0)
  const thumbLeftRef = useRef(0)
  const [containerWidth, setContainerWidth] = useState(0)

  const itemWidth = barWidth + 24
  const chartItems = useMemo(() => {
    const reasonKeys = new Set<string>()

    data.forEach((entry) => {
      Object.keys(entry.reasons ?? {}).forEach((reasonKey) => reasonKeys.add(reasonKey))
    })

    return Array.from(reasonKeys)
      .sort((left, right) => left.localeCompare(right))
      .map((reasonKey, index) => ({
        key: reasonKey,
        label: getOutageReasonLabel(reasonKey, t),
        color: outageColors[index % outageColors.length],
        data: data.length
          ? data.map((entry) => {
              const rawValue = entry.reasons?.[reasonKey]
              if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
                return rawValue
              }
              return 0
            })
          : [0],
      }))
  }, [data, t])

  const isEmpty = data.length === 0
  const categories = useMemo(
    () => (isEmpty ? [''] : data.map((entry) => entry.label)),
    [data, isEmpty]
  )
  const stackedValues = useMemo(
    () =>
      categories.map((_, categoryIndex) =>
        chartItems.reduce((sum, item) => sum + (item.data[categoryIndex] ?? 0), 0)
      ),
    [categories, chartItems]
  )
  const yAxisMax = useMemo(
    () => (isEmpty ? 100 : Math.max(100, ...stackedValues)),
    [isEmpty, stackedValues]
  )
  const yAxisInterval = useMemo(() => Math.max(1, Math.ceil(yAxisMax / 25)) * 5, [yAxisMax])
  const alignedYAxisMax = useMemo(
    () => Math.ceil(yAxisMax / yAxisInterval) * yAxisInterval,
    [yAxisInterval, yAxisMax]
  )
  const chartGridTop = 24
  const chartGridBottom = 112

  const option = useMemo<echarts.EChartsOption>(() => {
    const seriesCount = chartItems.length

    return {
      tooltip: {
        show: true,
        trigger: 'item',
        formatter: (params: unknown) => {
          const point = params as {
            name?: string
            dataIndex?: number
            seriesName?: string
            value?: number | string
          }
          const rawValue =
            typeof point.value === 'number' ? point.value : Number(point.value ?? Number.NaN)
          const formattedValue = Number.isFinite(rawValue) ? rawValue.toFixed(1) : '-'
          const label =
            typeof point.dataIndex === 'number'
              ? (data[point.dataIndex]?.label ?? '')
              : (point.name ?? '')
          const safeName = echarts.format.encodeHTML(formatIsoDateToDayFirst(label))
          const safeSeriesName = echarts.format.encodeHTML(point.seriesName ?? '')

          return `<strong>${safeName}</strong><br/>${safeSeriesName}: ${formattedValue}`
        },
      },
      grid: {
        left: 0,
        right: '16px',
        top: chartGridTop,
        bottom: chartGridBottom,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        axisLabel: {
          show: true,
          rotate: 45,
          interval: 0,
          margin: xAxisLabelMargin,
          fontSize: bodyText7.fontSize,
          lineHeight: bodyText7.lineHeight,
          fontWeight: 400,
          formatter: (value: string) => formatAxisLabel(value),
          color: bodyText7.color || '#374151',
          overflow: 'none',
        },
        name: '',
        nameLocation: 'middle',
        nameGap: 64,
        nameTextStyle: {
          fontSize: bodyText7.fontSize,
          lineHeight: bodyText7.lineHeight,
          fontWeight: 400,
          color: bodyText7.color || '#374151',
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          show: false,
          fontSize: bodyText7.fontSize,
          lineHeight: bodyText7.lineHeight,
          fontWeight: 400,
          color: bodyText7.color,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        position: 'right',
        max: alignedYAxisMax,
        interval: yAxisInterval,
        splitLine: {
          lineStyle: {
            color: '#E4E4E7',
          },
        },
      },
      series: chartItems.map((item, index) => {
        const isTop = index === seriesCount - 1
        const isBottom = index === 0
        const borderRadius: [number, number, number, number] =
          isTop && isBottom
            ? [barRadius, barRadius, barRadius, barRadius]
            : isTop
              ? [barRadius, barRadius, 0, 0]
              : isBottom
                ? [0, 0, barRadius, barRadius]
                : [0, 0, 0, 0]

        return {
          name: item.label,
          type: 'bar',
          stack: 'outages',
          data: item.data,
          barWidth,
          barCategoryGap,
          itemStyle: {
            color: item.color,
            borderRadius,
          },
          emphasis: {
            itemStyle: {
              color: item.color,
              borderRadius,
            },
          },
        }
      }),
    }
  }, [
    barCategoryGap,
    barRadius,
    barWidth,
    bodyText7,
    categories,
    chartItems,
    chartGridBottom,
    chartGridTop,
    data,
    alignedYAxisMax,
    xAxisLabelMargin,
    yAxisInterval,
  ])

  const axisOption = useMemo<echarts.EChartsOption>(() => {
    return {
      tooltip: {
        show: false,
      },
      grid: {
        left: 0,
        right: '16px',
        top: chartGridTop,
        bottom: chartGridBottom,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: [''],
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        axisLabel: {
          show: true,
          rotate: 45,
          margin: xAxisLabelMargin,
          fontSize: bodyText7.fontSize,
          lineHeight: bodyText7.lineHeight,
          fontWeight: 400,
          formatter: (value: string) => formatAxisLabel(value),
          color: 'transparent',
        },
      },
      yAxis: {
        type: 'value',
        name: '',
        axisLabel: {
          align: 'right',
          margin: 5,
          fontSize: bodyText7.fontSize,
          lineHeight: bodyText7.lineHeight,
          fontWeight: 400,
          color: bodyText7.color,
        },
        position: 'right',
        min: 0,
        max: alignedYAxisMax,
        interval: yAxisInterval,
        splitLine: {
          show: false,
        },
      },
      series: [
        {
          type: 'bar',
          data: [0],
          barWidth: 0,
          itemStyle: {
            opacity: 0,
          },
        },
      ],
      animation: false,
    }
  }, [alignedYAxisMax, bodyText7, chartGridBottom, chartGridTop, xAxisLabelMargin, yAxisInterval])

  const containerHeight = typeof height === 'number' ? `${height}px` : height
  const legendItems = chartItems.map((item) => ({
    key: item.key,
    label: item.label,
    color: item.color,
  }))
  const categoryCount = Math.max(data.length, 1)
  const baseChartWidth = categoryCount * itemWidth
  const shouldScroll = containerWidth > 0 && baseChartWidth > containerWidth
  const chartWidth = `${baseChartWidth}px`

  const getTrackWidth = () => scrollbarTrackRef.current?.getBoundingClientRect().width ?? 0

  const updateThumbFromScroll = useCallback(() => {
    const node = chartScrollRef.current
    const thumb = scrollbarThumbRef.current
    if (!node || !thumb) return
    const trackWidth = getTrackWidth()
    if (trackWidth === 0) return
    const ratio = node.scrollWidth > 0 ? node.clientWidth / node.scrollWidth : 1
    const thumbWidth = Math.max(30, Math.floor(trackWidth * ratio))
    const maxThumbTravel = Math.max(0, trackWidth - thumbWidth)
    const maxScroll = node.scrollWidth - node.clientWidth
    const nextLeft =
      maxScroll <= 0 || maxThumbTravel === 0 ? 0 : (node.scrollLeft / maxScroll) * maxThumbTravel
    thumb.style.width = `${thumbWidth}px`
    thumb.style.left = `${nextLeft}px`
    thumbLeftRef.current = nextLeft
  }, [])

  useEffect(() => {
    const node = chartScrollRef.current
    if (!node) return
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
      updateThumbFromScroll()
    })
    resizeObserver.observe(node)
    return () => resizeObserver.disconnect()
  }, [updateThumbFromScroll])

  useEffect(() => {
    const node = scrollbarTrackRef.current
    if (!node) return
    const resizeObserver = new ResizeObserver(updateThumbFromScroll)
    resizeObserver.observe(node)
    return () => resizeObserver.disconnect()
  }, [updateThumbFromScroll])

  useEffect(() => {
    updateThumbFromScroll()
  }, [data.length, containerWidth, updateThumbFromScroll])

  const handleThumbPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!shouldScroll) return
    isDraggingThumb.current = true
    dragStartX.current = e.clientX
    dragStartLeft.current = thumbLeftRef.current
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleThumbPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb.current) return
    const node = chartScrollRef.current
    if (!node) return
    const trackWidth = getTrackWidth()
    if (trackWidth === 0) return
    const ratio = node.scrollWidth > 0 ? node.clientWidth / node.scrollWidth : 1
    const thumbWidth = Math.max(30, Math.floor(trackWidth * ratio))
    const maxThumbTravel = Math.max(0, trackWidth - thumbWidth)
    if (maxThumbTravel === 0) return
    const delta = e.clientX - dragStartX.current
    const nextLeft = Math.min(Math.max(dragStartLeft.current + delta, 0), maxThumbTravel)
    const thumb = scrollbarThumbRef.current
    if (thumb) thumb.style.left = `${nextLeft}px`
    thumbLeftRef.current = nextLeft
    const maxScroll = node.scrollWidth - node.clientWidth
    node.scrollLeft = (nextLeft / maxThumbTravel) * maxScroll
  }

  const handleThumbPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb.current) return
    isDraggingThumb.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
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
      <Box flex={1} minH={0} overflow="visible" display="flex">
        <Box width="64px" flexShrink={0} position="relative">
          <EChartsWrapper option={axisOption} height="100%" />
          <Box
            position="absolute"
            left="0px"
            top="50%"
            transform="translateY(-50%) rotate(-180deg)"
            textStyle="bodyText7"
            fontWeight="400"
            color={bodyText7.color}
            whiteSpace="nowrap"
            pointerEvents="none"
            sx={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
            }}
          >
            {t('outageAndSubmissionCharts.axis.noOfReasons', { defaultValue: 'No. of days' })}
          </Box>
        </Box>
        <Box
          ref={chartScrollRef}
          overflowX={shouldScroll ? 'auto' : 'hidden'}
          overflowY="hidden"
          height="100%"
          flex="1"
          onScroll={updateThumbFromScroll}
          className="outages-scroll-container"
          sx={{
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { height: '0px' },
          }}
        >
          <div
            style={{
              width: shouldScroll ? chartWidth : '100%',
              height: '100%',
              margin: shouldScroll ? '0' : undefined,
            }}
          >
            <EChartsWrapper option={option} height="100%" />
          </div>
        </Box>
      </Box>
      <div
        style={{
          textAlign: 'center',
          fontSize: bodyText7.fontSize,
          lineHeight: `${bodyText7.lineHeight}px`,
          fontWeight: 400,
          color: bodyText7.color,
          marginTop: '4px',
        }}
      >
        {xAxisLabel}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          paddingTop: '8px',
          flexWrap: 'wrap',
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
      {shouldScroll && (
        <div style={{ marginTop: '6px' }}>
          <div
            ref={scrollbarTrackRef}
            style={{
              height: '4px',
              background: 'var(--chakra-colors-neutral-200)',
              borderRadius: '999px',
              position: 'relative',
            }}
          >
            <div
              role="presentation"
              ref={scrollbarThumbRef}
              onPointerDown={handleThumbPointerDown}
              onPointerMove={handleThumbPointerMove}
              onPointerUp={handleThumbPointerUp}
              onPointerLeave={handleThumbPointerUp}
              onPointerCancel={handleThumbPointerUp}
              style={{
                position: 'absolute',
                top: 0,
                height: '4px',
                width: '30px',
                maxWidth: '100%',
                background: 'var(--chakra-colors-primary-300)',
                borderRadius: '999px',
                cursor: 'grab',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
