import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import '@testing-library/jest-dom/jest-globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { LineChart } from './line-chart'

const mockReactECharts = jest.fn(({ option }: { option: { series?: unknown[] } }) => (
  <div data-testid="echarts-mock" data-series-count={option?.series?.length ?? 0} />
))

jest.mock('echarts-for-react', () => ({
  __esModule: true,
  default: (props: { option: unknown }) => mockReactECharts(props as never),
}))

const resizeObserverDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver')

beforeAll(() => {
  class ResizeObserverMock {
    constructor(_callback: ResizeObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
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

describe('LineChart', () => {
  it('builds one series per yKey and uses legend labels when provided', () => {
    const data = [
      { q: 'Q1', a: 1, b: 2 },
      { q: 'Q2', a: 3, b: 4 },
    ]

    renderWithProviders(
      <LineChart
        data={data}
        xKey="q"
        yKeys={['a', 'b']}
        legendLabels={['Series A', 'Series B']}
        xAxisLabel="Quarter"
        yAxisLabel="Units"
      />
    )

    expect(screen.getByTestId('echarts-mock')).toHaveAttribute('data-series-count', '2')

    const option = (
      mockReactECharts.mock.calls as Array<
        [
          {
            option: {
              legend?: { data?: string[] }
              xAxis?: { data?: string[]; name?: string }
              yAxis?: { name?: string }
              series?: Array<{ name?: string; data?: number[] }>
            }
          },
        ]
      >
    )[0][0].option

    expect(option.legend?.data).toEqual(['Series A', 'Series B'])
    expect(option.xAxis?.data).toEqual(['Q1', 'Q2'])
    expect(option.xAxis?.name).toBe('Quarter')
    expect(option.yAxis?.name).toBe('Units')
    expect(option.series?.map((s) => s.name)).toEqual(['Series A', 'Series B'])
    expect(option.series?.map((s) => s.data)).toEqual([
      [1, 3],
      [2, 4],
    ])
  })
})
