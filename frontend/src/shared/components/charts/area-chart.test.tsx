import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import '@testing-library/jest-dom/jest-globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { AreaChart } from './area-chart'

const mockReactECharts = jest.fn(
  ({ option }: { option: { series?: Array<{ data?: number[]; name?: string }> } }) => (
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

describe('AreaChart', () => {
  it('maps data keys into the chart option passed to echarts', () => {
    const data = [
      { month: 'Jan', value: 10 },
      { month: 'Feb', value: 20 },
    ]

    renderWithProviders(
      <AreaChart data={data} xKey="month" yKey="value" legendLabel="Supply" height="240px" />
    )

    expect(screen.getByTestId('echarts-mock')).toHaveAttribute('data-series-count', '1')
    expect(mockReactECharts).toHaveBeenCalled()
    const option = (
      mockReactECharts.mock.calls as Array<
        [{ option: { xAxis?: { data?: string[] }; series?: Array<{ data?: number[] }> } }]
      >
    )[0][0].option

    expect(option.xAxis?.data).toEqual(['Jan', 'Feb'])
    expect(option.series?.[0]?.data).toEqual([10, 20])
  })
})
