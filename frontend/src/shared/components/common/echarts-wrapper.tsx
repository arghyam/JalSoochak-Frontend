import { useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

interface EChartsWrapperProps {
  option: EChartsOption
  className?: string
  height?: string | number
  renderer?: 'canvas' | 'svg'
  onChartReady?: (chart: echarts.ECharts) => void
  onChartReadyOnce?: (chart: echarts.ECharts) => void
}

export function EChartsWrapper({
  option,
  className,
  height = '400px',
  renderer = 'canvas',
  onChartReady,
  onChartReadyOnce,
}: EChartsWrapperProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)
  const chartInitializedRef = useRef(false)

  // Initialize chart and update options
  useEffect(() => {
    if (!chartRef.current) return

    const existingInstance = echarts.getInstanceByDom(chartRef.current)

    if (existingInstance && existingInstance !== chartInstanceRef.current) {
      chartInstanceRef.current = existingInstance
    }

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, undefined, { renderer })
    }

    const chart = chartInstanceRef.current

    if (!chartInitializedRef.current) {
      onChartReadyOnce?.(chart)
      chartInitializedRef.current = true
    }

    // Update chart options (doesn't re-create the chart)
    if (chart.isDisposed()) return
    chart.setOption(option, true)
    onChartReady?.(chart)
  }, [onChartReady, onChartReadyOnce, option, renderer])

  // Handle window resize
  useEffect(() => {
    const chart = chartInstanceRef.current
    if (!chart) return

    const handleResize = () => {
      if (!chart.isDisposed()) {
        chart.resize()
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Handle parent/container resize (e.g., layout changes without window resize)
  useEffect(() => {
    const chart = chartInstanceRef.current
    if (!chart || !chartRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (!chart.isDisposed()) {
        chart.resize()
      }
    })

    resizeObserver.observe(chartRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Cleanup: dispose chart on unmount only
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
        chartInstanceRef.current = null
        chartInitializedRef.current = false
      }
    }
  }, [renderer])

  return (
    <div
      ref={chartRef}
      className={className}
      style={{
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  )
}
