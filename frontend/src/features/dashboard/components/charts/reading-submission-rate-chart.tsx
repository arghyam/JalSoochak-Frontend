import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { Box, useBreakpointValue, useTheme } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import * as echarts from 'echarts'
import { EChartsWrapper } from '@/shared/components/common'
import { formatAxisLabel } from '@/shared/components/charts/axis-label-format'
import { getBodyText7Style } from '@/shared/components/charts/chart-text-style'
import type { EntityPerformance } from '../../types'

interface ReadingSubmissionRateChartProps {
  data: EntityPerformance[]
  className?: string
  height?: string | number
  maxItems?: number
  entityLabel?: string
}

export function ReadingSubmissionRateChart({
  data,
  className,
  height = '500px',
  maxItems = 5,
  entityLabel = 'States/UTs',
}: ReadingSubmissionRateChartProps) {
  const { t } = useTranslation('dashboard')
  const theme = useTheme()
  const bodyText7 = getBodyText7Style(theme)
  const barWidth = useBreakpointValue({ base: 28, sm: 28, md: 42, lg: 66 }) ?? 66
  const barRadius = useBreakpointValue({ base: 8, sm: 10, md: 12 }) ?? 12
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
  const dynamicBarWidth = Math.min(barWidth, Math.max(12, Math.floor(itemWidth * 0.6)))
  const longestEntityLabel = useMemo(() => {
    return data.reduce((longest, item) => {
      return item.name.length > longest.length ? item.name : longest
    }, '')
  }, [data])
  const localizedEntityLabel = useMemo(() => {
    const normalized = entityLabel.trim().toLowerCase()
    const labelLookup: Record<string, { key: string; defaultValue: string }> = {
      'states/uts': { key: 'performanceCharts.viewBy.statesUTs', defaultValue: 'States/UTs' },
      'state/ut': { key: 'performanceCharts.viewBy.statesUTs', defaultValue: 'States/UTs' },
      districts: { key: 'performanceCharts.viewBy.districts', defaultValue: 'Districts' },
      district: { key: 'performanceCharts.viewBy.districts', defaultValue: 'Districts' },
      blocks: { key: 'performanceCharts.viewBy.blocks', defaultValue: 'Blocks' },
      block: { key: 'performanceCharts.viewBy.blocks', defaultValue: 'Blocks' },
      'gram panchayats': {
        key: 'performanceCharts.viewBy.gramPanchayats',
        defaultValue: 'Gram Panchayats',
      },
      'gram panchayat': {
        key: 'performanceCharts.viewBy.gramPanchayats',
        defaultValue: 'Gram Panchayats',
      },
      villages: { key: 'performanceCharts.viewBy.villages', defaultValue: 'Villages' },
      village: { key: 'performanceCharts.viewBy.villages', defaultValue: 'Villages' },
    }
    const labelConfig = labelLookup[normalized]
    if (labelConfig) {
      return t(labelConfig.key, { defaultValue: labelConfig.defaultValue })
    }
    return entityLabel
  }, [entityLabel, t])

  const option = useMemo<echarts.EChartsOption>(() => {
    const entities = data.map((d) => d.name)
    const rates = data.map((d) => d.regularity)

    return {
      tooltip: {
        show: true,
        trigger: 'axis',
        axisPointer: {
          type: 'none',
        },
        formatter: (params: unknown) => {
          const points = Array.isArray(params)
            ? (params as Array<{
                axisValueLabel?: string
                dataIndex?: number
                seriesName?: string
                value?: number | string
              }>)
            : []

          if (points.length === 0) {
            return ''
          }

          const firstPoint = points[0]
          const entityName =
            typeof firstPoint?.dataIndex === 'number'
              ? (data[firstPoint.dataIndex]?.name ?? '')
              : (firstPoint?.axisValueLabel ?? '')
          const safeEntityName = echarts.format.encodeHTML(entityName)
          const rows = points
            .map((point) => {
              const rawValue = typeof point.value === 'number' ? point.value : Number(point.value)
              const hasNumericValue = Number.isFinite(rawValue)
              const formattedValue = hasNumericValue ? `${rawValue.toFixed(1)}%` : '-'

              const safeSeriesName = echarts.format.encodeHTML(point.seriesName ?? '')
              return `${safeSeriesName}: ${formattedValue}`
            })
            .join('<br/>')

          return `<strong>${safeEntityName}</strong><br/>${rows}`
        },
      },
      grid: {
        left: '0%',
        right: '4%',
        top: '10%',
        bottom: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: entities,
        axisLine: {
          lineStyle: {
            color: '#E4E4E7',
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          rotate: 45,
          interval: 0,
          margin: 8,
          fontSize: bodyText7.fontSize,
          lineHeight: bodyText7.lineHeight,
          fontWeight: 400,
          formatter: (value: string) => formatAxisLabel(value),
          color: bodyText7.color,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          show: false,
        },
        max: 100,
        interval: 25,
        splitLine: {
          lineStyle: {
            color: '#E4E4E7',
          },
        },
      },
      series: [
        {
          name: t('outageAndSubmissionCharts.series.submissionRate', {
            defaultValue: 'Submission Rate',
          }),
          type: 'bar',
          data: rates,
          barWidth: dynamicBarWidth,
          barCategoryGap: '45%',
          itemStyle: {
            color: '#3291D1',
            borderRadius: [barRadius, barRadius, barRadius, barRadius],
          },
          emphasis: {
            itemStyle: {
              color: '#84BDE3',
            },
          },
        },
      ],
    }
  }, [barRadius, bodyText7, data, dynamicBarWidth, t])

  const axisOption = useMemo<echarts.EChartsOption>(() => {
    const placeholderLabel = longestEntityLabel || 'W'
    return {
      tooltip: {
        show: false,
      },
      grid: {
        left: '20%',
        right: 0,
        top: '10%',
        bottom: '5%',
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
          rotate: 45,
          margin: 8,
          fontSize: bodyText7.fontSize,
          lineHeight: bodyText7.lineHeight,
          fontWeight: 400,
          formatter: (value: string) => formatAxisLabel(value),
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
        max: 100,
        interval: 25,
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
  }, [bodyText7, longestEntityLabel])

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

  useEffect(() => {
    updateThumbFromScroll()
  }, [data.length, containerWidth, updateThumbFromScroll])

  return (
    <div
      className={className}
      style={{
        width: '100%',
        minWidth: 0,
        height,
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
            {t('outageAndSubmissionCharts.axis.percentage', { defaultValue: 'Percentage' })}
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
        {localizedEntityLabel}
      </Box>
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
