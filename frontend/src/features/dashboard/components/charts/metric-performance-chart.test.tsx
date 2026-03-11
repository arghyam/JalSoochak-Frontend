import { describe, expect, it, jest, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { MetricPerformanceChart } from './metric-performance-chart'

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
    name: 'Andhra Pradesh',
    coverage: 52,
    regularity: 53,
    continuity: 0,
    quantity: 45,
    compositeScore: 58,
    status: 'needs-attention',
  },
  {
    id: 's2',
    name: 'Arunachal Pradesh',
    coverage: 86,
    regularity: 87,
    continuity: 0,
    quantity: 82,
    compositeScore: 79,
    status: 'good',
  },
]

describe('MetricPerformanceChart', () => {
  it('renders area+bar legends when area line is enabled', () => {
    renderWithProviders(
      <MetricPerformanceChart
        data={chartData}
        metric="quantity"
        yAxisLabel="Quantity"
        entityLabel="States/UTs"
        showAreaLine
        areaSeriesName="Demand"
        seriesName="Quantity"
      />
    )

    expect(screen.getAllByText('Quantity').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('States/UTs')).toBeTruthy()
    expect(screen.getByText('Demand')).toBeTruthy()
    expect(screen.getAllByTestId('echarts-wrapper')).toHaveLength(2)
  })

  it('renders only metric legend when area line is disabled', () => {
    renderWithProviders(
      <MetricPerformanceChart
        data={chartData}
        metric="regularity"
        yAxisLabel="Regularity"
        seriesName="Regularity"
      />
    )

    expect(screen.getAllByText('Regularity').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Demand')).toBeNull()
  })

  it('uses dynamic y-axis max in quantity mode', () => {
    renderWithProviders(
      <MetricPerformanceChart
        data={[
          { ...chartData[0], quantity: 132 },
          { ...chartData[1], quantity: 189 },
        ]}
        metric="quantity"
      />
    )

    const yAxisMaxes = (
      mockEChartsWrapper.mock.calls as Array<
        [{ option?: { yAxis?: { max?: number } | Array<{ max?: number }> } }]
      >
    )
      .map(([props]) => {
        const option = props.option
        if (!option) return undefined
        const yAxis = option.yAxis
        if (Array.isArray(yAxis)) return yAxis[0]?.max
        return yAxis?.max
      })
      .filter((max): max is number => typeof max === 'number')

    expect(yAxisMaxes).toContain(190)
  })

  it('supports keyboard horizontal scrolling when content overflows', async () => {
    renderWithProviders(
      <MetricPerformanceChart
        data={[
          ...chartData,
          { ...chartData[0], id: 's3', name: 'Bihar' },
          { ...chartData[1], id: 's4', name: 'Kerala' },
          { ...chartData[0], id: 's5', name: 'Maharashtra' },
          { ...chartData[1], id: 's6', name: 'Odisha' },
        ]}
        metric="quantity"
      />
    )

    const scrollRegion = await screen.findByTestId('metric-performance-scroll-region')

    await waitFor(() => {
      expect(scrollRegion.getAttribute('tabindex')).toBe('0')
    })

    Object.defineProperty(scrollRegion, 'clientWidth', {
      value: 200,
      configurable: true,
    })
    Object.defineProperty(scrollRegion, 'scrollWidth', {
      value: 900,
      configurable: true,
    })
    Object.defineProperty(scrollRegion, 'scrollLeft', {
      value: 0,
      writable: true,
      configurable: true,
    })

    fireEvent.keyDown(scrollRegion, { key: 'ArrowRight' })
    expect(scrollRegion.scrollLeft).toBe(40)

    fireEvent.keyDown(scrollRegion, { key: 'End' })
    expect(scrollRegion.scrollLeft).toBe(700)
  })

  it('escapes tooltip labels before returning html', () => {
    renderWithProviders(<MetricPerformanceChart data={chartData} metric="quantity" />)

    const call = (
      mockEChartsWrapper.mock.calls as Array<[{ option?: { tooltip?: { formatter?: unknown } } }]>
    ).find(([props]) => typeof props.option?.tooltip?.formatter === 'function')

    const formatter = call?.[0].option?.tooltip?.formatter as
      | ((params: unknown) => string)
      | undefined

    expect(typeof formatter).toBe('function')
    const html = formatter?.([
      {
        axisValueLabel: '<img src=x onerror=alert(1)>',
        seriesName: '<script>alert(1)</script>',
        value: 12.3,
      },
    ])

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).not.toContain('<script>alert(1)</script>')
  })
})
