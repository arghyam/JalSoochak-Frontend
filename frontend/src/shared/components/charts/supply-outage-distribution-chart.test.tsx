import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import { formatAxisLabel } from './axis-label-format'
import {
  SupplyOutageDistributionChart,
  type WaterSupplyOutageData,
} from './supply-outage-distribution-chart'

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

beforeEach(() => {
  mockEChartsWrapper.mockClear()
})

const chartData: WaterSupplyOutageData[] = [
  {
    label: 'Adilabad',
    reasons: {
      additionalProp1: 12,
      additionalProp2: 18,
      additionalProp3: 14,
    },
    electricityFailure: 12,
    pipelineLeak: 15,
    pumpFailure: 10,
    valveIssue: 18,
    sourceDrying: 14,
  },
]

describe('SupplyOutageDistributionChart', () => {
  it('formats long axis labels to two lines with ellipsis on overflow', () => {
    expect(formatAxisLabel('South Salmara Mankachar')).toBe('South Salmara\nMankachar')
    expect(formatAxisLabel('Dadra and Nagar Haveli and Daman and Diu')).toBe(
      'Dadra and\nNagar Havel...'
    )
  })

  it('adds extra space between x-axis labels and the axis line', () => {
    renderWithProviders(<SupplyOutageDistributionChart data={chartData} height="300px" />)

    const chartOption = (
      mockEChartsWrapper.mock.calls as Array<
        [{ option?: { xAxis?: { axisLabel?: { margin?: number } } } }]
      >
    )
      .map(([props]) => props.option)
      .find((option) => option?.xAxis?.axisLabel?.margin !== undefined)

    expect(chartOption?.xAxis?.axisLabel?.margin).toBe(14)
  })

  it('shows hover tooltip value and keeps segment color unchanged on emphasis', () => {
    renderWithProviders(<SupplyOutageDistributionChart data={chartData} height="300px" />)

    const option = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: {
              tooltip?: { show?: boolean; formatter?: (params: unknown) => string }
              series?: Array<{
                itemStyle?: { color?: string; borderRadius?: number | number[] }
                emphasis?: { itemStyle?: { color?: string; borderRadius?: number | number[] } }
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
      seriesName: 'Additional Prop2',
      value: 18,
    })
    expect(tooltipText).toContain('Adilabad')
    expect(tooltipText).toContain('Additional Prop2')
    expect(tooltipText).toContain('18.0')

    const series = option?.series ?? []
    expect(series).toHaveLength(3)
    series.forEach((stack) => {
      expect(stack.emphasis?.itemStyle?.color).toBe(stack.itemStyle?.color)
      expect(stack.emphasis?.itemStyle?.borderRadius).toEqual(stack.itemStyle?.borderRadius)
    })
  })

  it('keeps the full category name in tooltip when the axis label is shortened', () => {
    renderWithProviders(
      <SupplyOutageDistributionChart
        data={[
          {
            label: 'Dadra and Nagar Haveli and Daman and Diu',
            reasons: {
              electricityFailure: 12,
            },
            electricityFailure: 12,
            pipelineLeak: 0,
            pumpFailure: 0,
            valveIssue: 0,
            sourceDrying: 0,
          },
        ]}
        height="300px"
      />
    )

    const option = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: {
              tooltip?: { show?: boolean; formatter?: (params: unknown) => string }
              xAxis?: { axisLabel?: { formatter?: (value: string) => string } }
            }
          },
        ]
      >
    )
      .map(([props]) => props.option)
      .find((entry) => entry?.tooltip?.show === true)

    expect(option?.xAxis?.axisLabel?.formatter?.('Dadra and Nagar Haveli and Daman and Diu')).toBe(
      'Dadra and\nNagar Havel...'
    )

    const tooltipText = option?.tooltip?.formatter?.({
      name: 'Dadra and\nNagar Havel...',
      dataIndex: 0,
      seriesName: 'Electricity Failure',
      value: 12,
    })

    expect(tooltipText).toContain('Dadra and Nagar Haveli and Daman and Diu')
    expect(tooltipText).not.toContain('Dadra and\nNagar Havel...')
  })

  it('prefers translated labels for known outage reasons and falls back for dynamic ones', () => {
    renderWithProviders(
      <SupplyOutageDistributionChart
        data={[
          {
            label: 'Adilabad',
            reasons: {
              electricityFailure: 12,
              customReason: 4,
            },
            electricityFailure: 12,
            pipelineLeak: 0,
            pumpFailure: 0,
            valveIssue: 0,
            sourceDrying: 0,
          },
        ]}
        height="300px"
      />
    )

    expect(screen.getByText('Electrical failure')).toBeTruthy()
    expect(screen.getByText('Custom Reason')).toBeTruthy()
  })

  it('uses only api-provided reasons keys for series and legends', () => {
    renderWithProviders(
      <SupplyOutageDistributionChart
        data={[
          {
            label: 'Mapped row',
            reasons: {
              pumpFailure: 3,
            },
            electricityFailure: 0,
            pipelineLeak: 0,
            pumpFailure: 0,
            valveIssue: 0,
            sourceDrying: 0,
          },
          {
            label: 'Row without reasons',
            electricityFailure: 0,
            pipelineLeak: 0,
            pumpFailure: 7,
            valveIssue: 2,
            sourceDrying: 0,
          },
        ]}
        height="300px"
      />
    )

    expect(screen.queryByText('Valve issue')).toBeNull()

    const option = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: {
              tooltip?: { show?: boolean }
              series?: Array<{ name?: string; data?: number[] }>
            }
          },
        ]
      >
    )
      .map(([props]) => props.option)
      .find((entry) => entry?.tooltip?.show === true)

    const series = option?.series ?? []
    const pumpFailureSeries = series.find((entry) => entry.name === 'Pump failure')

    expect(series).toHaveLength(1)
    expect(pumpFailureSeries?.data).toEqual([3, 0])
  })

  it('keeps the left axis scale aligned with the plotted bar chart scale', () => {
    renderWithProviders(
      <SupplyOutageDistributionChart
        data={[
          {
            label: 'High total',
            reasons: {
              electricityFailure: 60,
              pipelineLeak: 55,
              pumpFailure: 40,
              valveIssue: 35,
              sourceDrying: 20,
            },
            electricityFailure: 60,
            pipelineLeak: 55,
            pumpFailure: 40,
            valveIssue: 35,
            sourceDrying: 20,
          },
        ]}
        height="300px"
      />
    )

    const options = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: {
              tooltip?: { show?: boolean }
              yAxis?: { max?: number; interval?: number }
            }
          },
        ]
      >
    ).map(([props]) => props.option)

    const chartOption = options.find((entry) => entry?.tooltip?.show === true)
    const leftAxisOption = options.find((entry) => entry?.tooltip?.show === false)

    expect(chartOption?.yAxis?.max).toBe(225)
    expect(chartOption?.yAxis?.interval).toBe(45)
    expect(leftAxisOption?.yAxis?.max).toBe(225)
    expect(leftAxisOption?.yAxis?.interval).toBe(45)
  })
})
