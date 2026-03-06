import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import { WaterSupplyOutagesChart, type WaterSupplyOutageData } from './water-supply-outages-chart'

const mockEChartsWrapper = jest.fn((_props: { option: unknown }) => (
  <div data-testid="echarts-wrapper" />
))

jest.mock('@/shared/components/common/echarts-wrapper', () => ({
  EChartsWrapper: (props: { option: unknown }) => mockEChartsWrapper(props),
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

const chartData: WaterSupplyOutageData[] = [
  {
    label: 'Adilabad',
    electricityFailure: 12,
    pipelineLeak: 15,
    pumpFailure: 10,
    valveIssue: 18,
    sourceDrying: 14,
  },
]

describe('WaterSupplyOutagesChart', () => {
  it('shows hover tooltip value and keeps segment color unchanged on emphasis', () => {
    renderWithProviders(<WaterSupplyOutagesChart data={chartData} height="300px" />)

    const option = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: {
              tooltip?: { show?: boolean; formatter?: (params: unknown) => string }
              series?: Array<{
                itemStyle?: { color?: string }
                emphasis?: { itemStyle?: { color?: string } }
              }>
            }
          },
        ]
      >
    )
      .map(([props]) => props.option)
      .find((entry) => entry?.tooltip?.show === true)

    expect(option?.tooltip?.show).toBe(true)

    const formatter = option?.tooltip?.formatter
    expect(typeof formatter).toBe('function')
    const tooltipText = formatter?.({
      name: 'Adilabad',
      seriesName: 'Valve issue',
      value: 18,
    })
    expect(tooltipText).toContain('Adilabad')
    expect(tooltipText).toContain('Valve issue')
    expect(tooltipText).toContain('18.0')

    const series = option?.series ?? []
    series.forEach((stack) => {
      expect(stack.emphasis?.itemStyle?.color).toBe(stack.itemStyle?.color)
    })
  })
})
