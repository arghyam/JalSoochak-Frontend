import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { Box, useBreakpointValue, useTheme } from '@chakra-ui/react'
import * as echarts from 'echarts'
import { EChartsWrapper } from '@/shared/components/common'
import { getBodyText7Style } from './chart-text-style'

export interface WaterSupplyOutageData {
  /** Label shown on the X-axis (state, district, block, sub-division, village, etc.) */
  label: string
  electricityFailure: number
  pipelineLeak: number
  pumpFailure: number
  valveIssue: number
  sourceDrying: number
}

interface WaterSupplyOutagesChartProps {
  data: WaterSupplyOutageData[]
  className?: string
  height?: string | number
  xAxisLabel?: string
}

const outageColors = {
  electricityFailure: '#D6E9F6',
  pipelineLeak: '#ADD3ED',
  pumpFailure: '#84BDE3',
  valveIssue: '#3291D1',
  sourceDrying: '#1E577D',
}

export function WaterSupplyOutagesChart({
  data,
  className,
  height = '300px',
  xAxisLabel = 'Districts',
}: WaterSupplyOutagesChartProps) {
  const theme = useTheme()
  const bodyText7 = getBodyText7Style(theme)
  const barWidth = useBreakpointValue({ base: 28, sm: 28, md: 42, lg: 66 }) ?? 66
  const barRadius = useBreakpointValue({ base: 8, sm: 10, md: 12 }) ?? 12
  const barCategoryGap = '24px'
  const chartScrollRef = useRef<HTMLDivElement>(null)
  const scrollbarTrackRef = useRef<HTMLDivElement>(null)
  const scrollbarThumbRef = useRef<HTMLDivElement>(null)
  const isDraggingThumb = useRef(false)
  const dragStartX = useRef(0)
  const dragStartLeft = useRef(0)
  const thumbLeftRef = useRef(0)
  const [containerWidth, setContainerWidth] = useState(0)

  const itemWidth = barWidth + 24

  const option = useMemo<echarts.EChartsOption>(() => {
    const isEmpty = data.length === 0
    const categories = isEmpty ? [''] : data.map((entry) => entry.label)
    const sourceDryingData = isEmpty ? [0] : data.map((entry) => entry.sourceDrying)
    const valveIssueData = isEmpty ? [0] : data.map((entry) => entry.valveIssue)
    const pumpFailureData = isEmpty ? [0] : data.map((entry) => entry.pumpFailure)
    const pipelineLeakData = isEmpty ? [0] : data.map((entry) => entry.pipelineLeak)
    const electricityFailureData = isEmpty ? [0] : data.map((entry) => entry.electricityFailure)

    return {
      tooltip: {
        show: false,
      },
      grid: {
        left: 0,
        right: '4%',
        top: 10,
        bottom: 10,
        containLabel: true,
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
          margin: 8,
          fontSize: bodyText7.fontSize,
          lineHeight: bodyText7.lineHeight,
          fontWeight: 400,
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
          name: 'Source Drying',
          type: 'bar',
          stack: 'outages',
          data: sourceDryingData,
          barWidth,
          barCategoryGap,
          itemStyle: {
            color: outageColors.sourceDrying,
            borderRadius: [0, 0, barRadius, barRadius],
          },
        },
        {
          name: 'Valve issue',
          type: 'bar',
          stack: 'outages',
          data: valveIssueData,
          barWidth,
          barCategoryGap,
          itemStyle: {
            color: outageColors.valveIssue,
          },
        },
        {
          name: 'Pump failure',
          type: 'bar',
          stack: 'outages',
          data: pumpFailureData,
          barWidth,
          barCategoryGap,
          itemStyle: {
            color: outageColors.pumpFailure,
          },
        },
        {
          name: 'Pipeline break',
          type: 'bar',
          stack: 'outages',
          data: pipelineLeakData,
          barWidth,
          barCategoryGap,
          itemStyle: {
            color: outageColors.pipelineLeak,
          },
        },
        {
          name: 'Electrical failure',
          type: 'bar',
          stack: 'outages',
          data: electricityFailureData,
          barWidth,
          barCategoryGap,
          itemStyle: {
            color: outageColors.electricityFailure,
            borderRadius: [barRadius, barRadius, 0, 0],
          },
        },
      ],
    }
  }, [data, bodyText7, barWidth, barRadius, barCategoryGap])

  const axisOption = useMemo<echarts.EChartsOption>(() => {
    return {
      tooltip: {
        show: false,
      },
      grid: {
        left: 0,
        right: 0,
        top: 10,
        bottom: 10,
        containLabel: true,
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
          margin: 8,
          formatter: () => '',
          // color: 'transparent',
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
  }, [bodyText7])

  const containerHeight = typeof height === 'number' ? `${height}px` : height
  const legendItems = [
    { label: 'Electrical failure', color: outageColors.electricityFailure },
    { label: 'Pipeline break', color: outageColors.pipelineLeak },
    { label: 'Pump failure', color: outageColors.pumpFailure },
    { label: 'Valve issue', color: outageColors.valveIssue },
    { label: 'Source Drying', color: outageColors.sourceDrying },
  ]
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
    const thumbWidth = Math.min(163, trackWidth)
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
            left="-18px"
            top="50%"
            transform="translateY(-50%) rotate(-90deg)"
            transformOrigin="center"
            textStyle="bodyText7"
            fontWeight="400"
            color={bodyText7.color}
            whiteSpace="nowrap"
          >
            No. of days
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
      {shouldScroll && (
        <div style={{ marginTop: '6px' }}>
          <div
            ref={scrollbarTrackRef}
            style={{
              height: '4px',
              background: 'transparent',
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
                width: '163px',
                maxWidth: '100%',
                background: '#E4E4E7',
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
