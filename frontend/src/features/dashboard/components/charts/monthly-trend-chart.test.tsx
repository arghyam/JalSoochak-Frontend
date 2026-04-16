import { describe, expect, it, jest, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import { MonthlyTrendChart, type MonthlyTrendPoint } from './monthly-trend-chart'

const mockEChartsWrapper = jest.fn((_props: { option: unknown }) => (
  <div data-testid="echarts-wrapper" />
))

jest.mock('@/shared/components/common/echarts-wrapper', () => ({
  EChartsWrapper: (props: { option: unknown }) => mockEChartsWrapper(props),
}))

const resizeObserverDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver')

beforeAll(() => {
  class ResizeObserverMock {
    private readonly callback: ResizeObserverCallback

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }

    observe(target: Element) {
      this.callback(
        [
          {
            target,
            contentRect: { width: 120, height: 300 } as DOMRectReadOnly,
            borderBoxSize: [] as unknown as ResizeObserverSize[],
            contentBoxSize: [] as unknown as ResizeObserverSize[],
            devicePixelContentBoxSize: [] as unknown as ResizeObserverSize[],
          } as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver
      )
    }
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock,
  })
})

afterAll(() => {
  if (resizeObserverDescriptor) {
    Object.defineProperty(globalThis, 'ResizeObserver', resizeObserverDescriptor)
  } else {
    delete (globalThis as Record<string, unknown>).ResizeObserver
  }
})

beforeEach(() => {
  mockEChartsWrapper.mockClear()
})

const chartData: MonthlyTrendPoint[] = [
  { period: '02 Mar', value: 0 },
  { period: '03 Mar', value: 12 },
]

describe('MonthlyTrendChart', () => {
  it('uses the same axis spacing as the metric performance chart', () => {
    renderWithProviders(
      <MonthlyTrendChart
        data={chartData}
        isPercent
        xAxisLabel="Month"
        yAxisLabel="Regularity"
        seriesName="Regularity"
      />
    )

    const chartOption = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: {
              xAxis?: { axisLabel?: { margin?: number; rotate?: number; interval?: number } }
            }
          },
        ]
      >
    )
      .map(([props]) => props.option)
      .find((option) => option?.xAxis?.axisLabel?.margin !== undefined)

    const axisOption = (
      mockEChartsWrapper.mock.calls as Array<
        [{ option?: { yAxis?: { axisLabel?: { margin?: number } } } }]
      >
    )
      .map(([props]) => props.option)
      .find((option) => option?.yAxis?.axisLabel?.margin !== undefined)

    expect(chartOption?.xAxis?.axisLabel?.margin).toBe(30)
    expect(chartOption?.xAxis?.axisLabel?.rotate).toBe(45)
    expect(chartOption?.xAxis?.axisLabel?.interval).toBe(0)
    expect(axisOption?.yAxis?.axisLabel?.margin).toBe(-12)
  })

  it('keeps zero-only quantity trend anchored to the bottom with dynamic max', () => {
    renderWithProviders(
      <MonthlyTrendChart
        data={[
          { period: '18 Mar', value: 0 },
          { period: '19 Mar', value: 0 },
        ]}
        valueDivisor={1000000}
      />
    )

    const chartOption = (
      mockEChartsWrapper.mock.calls as Array<
        [{ option?: { yAxis?: { max?: number; min?: number } } }]
      >
    )
      .map(([props]) => props.option)
      .find((option) => option?.yAxis?.max !== undefined)

    expect(chartOption?.yAxis?.min).toBe(0)
    expect(chartOption?.yAxis?.max).toBe(1000000)
  })

  it('uses a dynamic quantity scale and readable labels for small MLD values', () => {
    renderWithProviders(
      <MonthlyTrendChart
        data={[
          { period: '18 Mar', value: 50000 },
          { period: '19 Mar', value: 120000 },
        ]}
        valueDivisor={1000000}
      />
    )

    const axisOption = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: {
              yAxis?: {
                max?: number
                axisLabel?: { formatter?: (value: number) => string }
              }
            }
          },
        ]
      >
    )
      .map(([props]) => props.option)
      .find((option) => option?.yAxis?.axisLabel?.formatter !== undefined)

    const yAxis = axisOption?.yAxis

    expect(yAxis?.max).toBe(200000)
    expect(yAxis?.axisLabel?.formatter?.(100000)).toBe('0.1')
  })

  it('formats percent and quantity tooltip values, including non-numeric fallback', () => {
    renderWithProviders(
      <MonthlyTrendChart
        data={[
          { period: '10 Apr', value: 1250 },
          { period: '11 Apr', value: 2500 },
        ]}
        seriesName="Supply"
        valueDivisor={1000}
      />
    )

    const mainOption = (
      mockEChartsWrapper.mock.calls as Array<
        [{ option?: { tooltip?: { show?: boolean; formatter?: (params: unknown) => string } } }]
      >
    )
      .map(([props]) => props.option)
      .find((option) => option?.tooltip?.show === true)

    const formatter = mainOption?.tooltip?.formatter
    expect(formatter?.([])).toBe('')
    const tooltipText = formatter?.([
      { axisValueLabel: '10 Apr', seriesName: 'Supply', value: 2500 },
      { axisValueLabel: '10 Apr', seriesName: 'Broken', value: 'NaN' },
    ])
    expect(tooltipText).toContain('10 Apr')
    expect(tooltipText).toContain('Supply: 2.5')
    expect(tooltipText).toContain('Broken: -')
  })

  it('formats percent axis ticks with integer and decimal values', () => {
    renderWithProviders(
      <MonthlyTrendChart
        data={[
          { period: 'A', value: 0 },
          { period: 'B', value: 75.5 },
        ]}
        isPercent
      />
    )

    const axisOption = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: { yAxis?: { axisLabel?: { formatter?: (value: number) => string } } }
          },
        ]
      >
    )
      .map(([props]) => props.option)
      .find((option) => option?.yAxis?.axisLabel?.formatter !== undefined)

    const formatter = axisOption?.yAxis?.axisLabel?.formatter
    expect(formatter?.(25)).toBe('25')
    expect(formatter?.(25.5)).toBe('25.5')
  })
})
