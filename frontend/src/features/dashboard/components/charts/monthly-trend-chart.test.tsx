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
})
