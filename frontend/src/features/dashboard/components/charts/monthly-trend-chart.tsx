import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { Box, useTheme } from '@chakra-ui/react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { EChartsWrapper } from '@/shared/components/common'
import { getBodyText7Style } from '@/shared/components/charts/chart-text-style'

export interface MonthlyTrendPoint {
  period: string
  value: number
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendPoint[]
  className?: string
  height?: string | number
  maxItems?: number
  isPercent?: boolean
  xAxisLabel?: string
  yAxisLabel?: string
  seriesName?: string
}

export function MonthlyTrendChart({
  data,
  className,
  height = '400px',
  maxItems = 5,
  isPercent = false,
  xAxisLabel = 'Month',
  yAxisLabel = 'Value',
  seriesName = 'Trend',
}: MonthlyTrendChartProps) {
  const theme = useTheme()
  const bodyText7 = getBodyText7Style(theme)
  const normalizedMaxItems =
    typeof maxItems === 'number' && Number.isFinite(maxItems) ? Math.max(1, maxItems) : 1
  const chartScrollRef = useRef<HTMLDivElement>(null)
  const scrollbarTrackRef = useRef<HTMLDivElement>(null)
  const scrollbarThumbRef = useRef<HTMLDivElement>(null)
  const isDraggingThumb = useRef(false)
  const dragStartX = useRef(0)
  const dragStartLeft = useRef(0)
  const thumbLeftRef = useRef(0)
  const [containerWidth, setContainerWidth] = useState(0)

  const defaultItemWidth = 90
  const minItemWidth = 70
  const effectiveItemWidth =
    containerWidth > 0
      ? Math.max(minItemWidth, Math.floor(containerWidth / Math.max(data.length, 1)))
      : defaultItemWidth
  const itemWidth = Math.min(defaultItemWidth, effectiveItemWidth)
  const axisWidth = '56px'
  const axisLabelOffset = '-25px'
  const longestPeriodLabel = useMemo(() => {
    return data.reduce((longest, item) => {
      return item.period.length > longest.length ? item.period : longest
    }, '')
  }, [data])

  const yAxisScale = useMemo(() => {
    const values = data.map((item) => item.value)
    const maxValue = values.length > 0 ? Math.max(...values) : 0
    const max = maxValue > 100 ? Math.ceil(maxValue / 10) * 10 : 100

    return { max }
  }, [data])

  const option = useMemo<EChartsOption>(() => {
    const periods = data.map((item) => item.period)
    const values = data.map((item) => item.value)

    return {
      tooltip: {
        show: true,
        trigger: 'axis',
        axisPointer: {
          type: 'line',
        },
        formatter: (params: unknown) => {
          const points = Array.isArray(params)
            ? (params as Array<{
                axisValueLabel?: string
                seriesName?: string
                value?: number | string
              }>)
            : []

          if (points.length === 0) {
            return ''
          }

          const period = points[0]?.axisValueLabel ?? ''
          const safePeriod = echarts.format.encodeHTML(period)
          const rows = points
            .map((point) => {
              const rawValue = typeof point.value === 'number' ? point.value : Number(point.value)
              const hasNumericValue = Number.isFinite(rawValue)
              const formattedValue = hasNumericValue
                ? isPercent
                  ? `${rawValue.toFixed(1)}%`
                  : `${rawValue.toFixed(1)}`
                : '-'
              const safeSeriesName = echarts.format.encodeHTML(point.seriesName ?? '')

              return `${safeSeriesName}: ${formattedValue}`
            })
            .join('<br/>')

          return `<strong>${safePeriod}</strong><br/>${rows}`
        },
      },
      legend: {
        show: false,
      },
      grid: {
        left: '0%',
        right: '4%',
        top: '10%',
        bottom: '9%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: periods,
        axisLine: {
          lineStyle: {
            color: '#E4E4E7',
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          rotate: 0,
          fontSize: bodyText7.fontSize,
          lineHeight: bodyText7.lineHeight,
          fontWeight: 400,
          color: bodyText7.color,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            color: '#E4E4E7',
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: '#E4E4E7',
          },
        },
        min: 0,
        max: yAxisScale.max,
      },
      series: [
        {
          name: seriesName,
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          showSymbol: true,
          itemStyle: {
            color: '#3291D1',
          },
          lineStyle: {
            width: 1,
          },
        },
      ],
    }
  }, [bodyText7, data, isPercent, seriesName, yAxisScale.max])

  const axisOption = useMemo<EChartsOption>(() => {
    const placeholderLabel = longestPeriodLabel || 'W'
    return {
      tooltip: {
        show: false,
      },
      grid: {
        left: '20%',
        right: 0,
        top: '10%',
        bottom: '9%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: [placeholderLabel],
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        axisLabel: {
          show: true,
          margin: 8,
          fontSize: bodyText7.fontSize,
          lineHeight: bodyText7.lineHeight,
          fontWeight: 400,
          formatter: (value: string) => value,
          color: 'transparent',
        },
      },
      yAxis: {
        type: 'value',
        position: 'right',
        axisLabel: {
          align: 'right',
          margin: 5,
          fontSize: bodyText7.fontSize,
          lineHeight: bodyText7.lineHeight,
          fontWeight: 400,
          color: bodyText7.color,
        },
        min: 0,
        max: yAxisScale.max,
        splitLine: {
          show: false,
        },
      },
      series: [
        {
          type: 'line',
          data: [0],
          symbolSize: 0,
          lineStyle: {
            opacity: 0,
          },
        },
      ],
      animation: false,
    }
  }, [bodyText7, longestPeriodLabel, yAxisScale.max])

  const baseChartWidth = data.length * itemWidth
  const chartPixelWidth =
    containerWidth > 0 ? Math.max(baseChartWidth, containerWidth) : baseChartWidth
  const shouldScroll =
    data.length > normalizedMaxItems && containerWidth > 0 && baseChartWidth > containerWidth
  const chartWidth = shouldScroll ? `${chartPixelWidth}px` : '100%'

  const getTrackWidth = () => {
    return scrollbarTrackRef.current?.getBoundingClientRect().width ?? 0
  }

  const updateThumbFromScroll = useCallback(() => {
    const node = chartScrollRef.current
    const thumb = scrollbarThumbRef.current
    if (!node || !thumb) return
    const trackWidth = getTrackWidth()
    if (trackWidth === 0) return
    const thumbWidth = Math.min(163, trackWidth)
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
    return () => {
      resizeObserver.disconnect()
    }
  }, [updateThumbFromScroll])

  useEffect(() => {
    const node = scrollbarTrackRef.current
    if (!node) return

    const resizeObserver = new ResizeObserver(() => {
      updateThumbFromScroll()
    })

    resizeObserver.observe(node)
    return () => {
      resizeObserver.disconnect()
    }
  }, [updateThumbFromScroll])

  const handleThumbPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!shouldScroll) return
    isDraggingThumb.current = true
    dragStartX.current = event.clientX
    dragStartLeft.current = thumbLeftRef.current
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleThumbPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb.current) return
    const node = chartScrollRef.current
    if (!node) return
    const trackWidth = getTrackWidth()
    if (trackWidth === 0) return
    const thumbWidth = Math.min(163, trackWidth)
    const maxThumbTravel = Math.max(0, trackWidth - thumbWidth)
    if (maxThumbTravel === 0) return
    const delta = event.clientX - dragStartX.current
    const nextLeft = Math.min(Math.max(dragStartLeft.current + delta, 0), maxThumbTravel)
    const thumb = scrollbarThumbRef.current
    if (thumb) {
      thumb.style.left = `${nextLeft}px`
    }
    thumbLeftRef.current = nextLeft
    const maxScroll = node.scrollWidth - node.clientWidth
    node.scrollLeft = (nextLeft / maxThumbTravel) * maxScroll
  }

  const handleThumbPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb.current) return
    isDraggingThumb.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleThumbPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingThumb.current) return
    isDraggingThumb.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleScrollRegionKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!shouldScroll) return

      const node = chartScrollRef.current
      if (!node) return

      const maxScroll = Math.max(0, node.scrollWidth - node.clientWidth)
      if (maxScroll === 0) return

      let nextLeft = node.scrollLeft
      const step = 40
      const pageStep = Math.max(step, Math.floor(node.clientWidth * 0.9))

      switch (event.key) {
        case 'ArrowRight':
          nextLeft += step
          break
        case 'ArrowLeft':
          nextLeft -= step
          break
        case 'PageDown':
          nextLeft += pageStep
          break
        case 'PageUp':
          nextLeft -= pageStep
          break
        case 'Home':
          nextLeft = 0
          break
        case 'End':
          nextLeft = maxScroll
          break
        default:
          return
      }

      event.preventDefault()
      const clampedLeft = Math.min(Math.max(nextLeft, 0), maxScroll)
      node.scrollLeft = clampedLeft
      updateThumbFromScroll()
    },
    [shouldScroll, updateThumbFromScroll]
  )

  useEffect(() => {
    updateThumbFromScroll()
  }, [containerWidth, data.length, updateThumbFromScroll])

  const containerHeight = typeof height === 'number' ? `${height}px` : height

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
      <Box flex={1} minH={0} minW={0} overflow="visible" display="flex">
        <Box width={axisWidth} flexShrink={0} position="relative">
          <EChartsWrapper option={axisOption} height="100%" />
          <Box
            position="absolute"
            left={axisLabelOffset}
            top="50%"
            transform="translateY(-50%) rotate(-90deg)"
            transformOrigin="center"
            textStyle="bodyText7"
            fontWeight="400"
            color={bodyText7.color}
            whiteSpace="nowrap"
          >
            {yAxisLabel}
          </Box>
        </Box>
        <Box
          ref={chartScrollRef}
          overflowX={shouldScroll ? 'auto' : 'hidden'}
          overflowY="hidden"
          height="100%"
          flex="1"
          minW={0}
          onScroll={updateThumbFromScroll}
          onKeyDown={handleScrollRegionKeyDown}
          tabIndex={shouldScroll ? 0 : -1}
          aria-label={`${seriesName} trend chart scroll area`}
          _focusVisible={{
            outline: '2px solid',
            outlineColor: 'primary.500',
            outlineOffset: '2px',
          }}
          sx={{
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { height: '0px' },
          }}
        >
          <div
            style={{
              width: chartWidth,
              height: '100%',
            }}
          >
            <EChartsWrapper option={option} height="100%" />
          </div>
        </Box>
      </Box>
      <Box
        textAlign="center"
        textStyle="bodyText7"
        fontWeight="400"
        color={bodyText7.color}
        mt="4px"
      >
        {xAxisLabel}
      </Box>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          paddingTop: '8px',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '2px',
            backgroundColor: '#3291D1',
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
          {seriesName}
        </span>
      </div>
      <Box mt="6px">
        <Box
          ref={scrollbarTrackRef}
          height="4px"
          bg="neutral.200"
          borderRadius="999px"
          position="relative"
        >
          <Box
            role="presentation"
            position="absolute"
            top={0}
            height="4px"
            width="163px"
            maxW="100%"
            bg="neutral.300"
            borderRadius="999px"
            cursor={shouldScroll ? 'grab' : 'default'}
            ref={scrollbarThumbRef}
            onPointerDown={handleThumbPointerDown}
            onPointerMove={handleThumbPointerMove}
            onPointerUp={handleThumbPointerUp}
            onPointerLeave={handleThumbPointerUp}
            onPointerCancel={handleThumbPointerCancel}
          />
        </Box>
      </Box>
    </div>
  )
}
