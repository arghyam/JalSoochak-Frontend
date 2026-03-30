import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { ReadingSubmissionRateChart } from './reading-submission-rate-chart'

const mockEChartsWrapper = jest.fn((_props: { option: unknown }) => (
  <div data-testid="echarts-wrapper" />
))

jest.mock('@/shared/components/common/echarts-wrapper', () => ({
  EChartsWrapper: (props: { option: unknown }) => mockEChartsWrapper(props),
}))

const resizeObserverDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver')
const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')

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
            contentRect: { width: 360, height: 300 } as DOMRectReadOnly,
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

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})

afterAll(() => {
  if (resizeObserverDescriptor) {
    Object.defineProperty(globalThis, 'ResizeObserver', resizeObserverDescriptor)
  } else {
    delete (globalThis as Record<string, unknown>).ResizeObserver
  }

  if (matchMediaDescriptor) {
    Object.defineProperty(window, 'matchMedia', matchMediaDescriptor)
  } else {
    delete (window as unknown as Record<string, unknown>).matchMedia
  }
})

beforeEach(() => {
  mockEChartsWrapper.mockClear()
})

const chartData: EntityPerformance[] = [
  {
    id: 's1',
    name: 'Kerala',
    coverage: 80,
    regularity: 90,
    continuity: 0,
    quantity: 65,
    compositeScore: 75,
    status: 'good',
  },
]

describe('ReadingSubmissionRateChart', () => {
  it('adds extra space between x-axis labels and the axis line', () => {
    renderWithProviders(<ReadingSubmissionRateChart data={chartData} />)

    const chartOption = (
      mockEChartsWrapper.mock.calls as Array<
        [{ option?: { xAxis?: { axisLabel?: { margin?: number } } } }]
      >
    )
      .map(([props]) => props.option)
      .find((option) => option?.xAxis?.axisLabel?.margin !== undefined)

    expect(chartOption?.xAxis?.axisLabel?.margin).toBe(14)
  })

  it('enables tooltip and formats hovered value with percentage', () => {
    renderWithProviders(<ReadingSubmissionRateChart data={chartData} />)

    const mainOption = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: {
              series?: unknown[]
              tooltip?: { show?: boolean; formatter?: (params: unknown) => string }
            }
          },
        ]
      >
    )
      .map(([props]) => props.option)
      .find((option) => option?.tooltip?.show === true)

    expect(mainOption?.tooltip?.show).toBe(true)
    const formatter = mainOption?.tooltip?.formatter
    expect(typeof formatter).toBe('function')

    const content = formatter?.([
      { axisValueLabel: 'Kerala', seriesName: 'Submission Rate', value: 90 },
    ])
    expect(content).toContain('Kerala')
    expect(content).toContain('Submission Rate')
    expect(content).toContain('90.0%')
  })

  it('formats long axis labels and keeps the full entity name in tooltip', () => {
    renderWithProviders(
      <ReadingSubmissionRateChart
        data={[
          {
            ...chartData[0],
            name: 'Dadra and Nagar Haveli and Daman and Diu',
            regularity: 28,
          },
        ]}
      />
    )

    const options = (
      mockEChartsWrapper.mock.calls as Array<[{ option?: Record<string, unknown> }]>
    ).map(([props]) => props.option)

    const mainOption = options.find(
      (option) =>
        (option?.tooltip as { show?: boolean } | undefined)?.show === true &&
        Array.isArray(option?.series)
    )
    const axisLabel = (
      mainOption?.xAxis as { axisLabel?: { formatter?: (value: string) => string } }
    )?.axisLabel
    expect(axisLabel?.formatter?.('Dadra and Nagar Haveli and Daman and Diu')).toBe(
      'Dadra and\nNagar Havel...'
    )

    const formatter = (mainOption?.tooltip as { formatter?: (params: unknown) => string })
      ?.formatter
    const content = formatter?.([
      {
        axisValueLabel: 'Dadra and\nNagar Havel...',
        dataIndex: 0,
        seriesName: 'Submission Rate',
        value: 28,
      },
    ])

    expect(content).toContain('Dadra and Nagar Haveli and Daman and Diu')
    expect(content).not.toContain('Dadra and\nNagar Havel...')
  })
})
