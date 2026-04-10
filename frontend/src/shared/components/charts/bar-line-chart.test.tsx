import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import '@testing-library/jest-dom/jest-globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { BarLineChart } from './bar-line-chart'

const mockReactECharts = jest.fn(
  ({ option }: { option: { series?: Array<{ type?: string; data?: number[] }> } }) => (
    <div data-testid="echarts-mock" data-series-count={option?.series?.length ?? 0} />
  )
)

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

describe('BarLineChart', () => {
  it('passes bar and line series derived from keys and exposes chart img role', () => {
    const data = [
      { name: 'A', total: 5, rate: 2 },
      { name: 'B', total: 8, rate: 3 },
    ]

    renderWithProviders(
      <BarLineChart
        data={data}
        xKey="name"
        barKey="total"
        lineKey="rate"
        barLegendLabel="Total"
        lineLegendLabel="Rate"
      />
    )

    expect(screen.getByRole('img', { name: /chart showing total and rate/i })).toBeInTheDocument()
    expect(screen.getByTestId('echarts-mock')).toHaveAttribute('data-series-count', '2')

    const option = (
      mockReactECharts.mock.calls as Array<
        [
          {
            option: {
              legend?: { data?: string[] }
              xAxis?: { data?: string[] }
              series?: Array<{ type?: string; data?: number[]; yAxisIndex?: number }>
            }
          },
        ]
      >
    )[0][0].option

    expect(option.legend?.data).toEqual(['Total', 'Rate'])
    expect(option.xAxis?.data).toEqual(['A', 'B'])
    const lineSeries = option.series?.find((s) => s.type === 'line')
    const barSeries = option.series?.find((s) => s.type === 'bar')
    expect(lineSeries?.yAxisIndex).toBe(1)
    expect(lineSeries?.data).toEqual([2, 3])
    expect(barSeries?.data).toEqual([5, 8])
  })
})
