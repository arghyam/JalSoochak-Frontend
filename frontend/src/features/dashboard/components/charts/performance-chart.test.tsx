import { screen } from '@testing-library/react'
import { describe, expect, it, jest, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { AllStatesPerformanceChart } from './performance-chart'

const mockEChartsWrapper = jest.fn((_props: { option: unknown }) => (
  <div data-testid="echarts-mock" />
))

const resizeObserverDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver')

beforeAll(() => {
  class ResizeObserverMock {
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

jest.mock('@/shared/components/common', () => ({
  EChartsWrapper: (props: { option: unknown }) => mockEChartsWrapper(props),
}))

const data: EntityPerformance[] = [
  {
    id: 's1',
    name: 'State A',
    coverage: 50,
    regularity: 60,
    continuity: 0,
    quantity: 70,
    compositeScore: 62,
    status: 'good',
  },
  {
    id: 's2',
    name: 'State B',
    coverage: 40,
    regularity: 80,
    continuity: 0,
    quantity: 55,
    compositeScore: 58,
    status: 'needs-attention',
  },
]

describe('AllStatesPerformanceChart', () => {
  beforeEach(() => {
    mockEChartsWrapper.mockClear()
  })

  it('renders entity label, legend, and chart placeholders', () => {
    renderWithProviders(<AllStatesPerformanceChart data={data} entityLabel="States" height={200} />)

    expect(screen.getByText('States')).toBeTruthy()
    expect(screen.getByText('Quantity')).toBeTruthy()
    expect(screen.getByText('Regularity')).toBeTruthy()
    expect(screen.getAllByTestId('echarts-mock').length).toBeGreaterThanOrEqual(2)
  })

  it('renders default entity label when omitted', () => {
    renderWithProviders(<AllStatesPerformanceChart data={data} height={180} />)

    expect(screen.getByText('States/UTs')).toBeTruthy()
  })

  it('sorts bars by quantity descending for plotted series', () => {
    const unsortedData: EntityPerformance[] = [data[1], data[0]]
    renderWithProviders(<AllStatesPerformanceChart data={unsortedData} height={180} />)

    const mainOption = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: {
              series?: Array<{ name?: string; data?: number[] }>
              xAxis?: { data?: string[] }
            }
          },
        ]
      >
    )
      .map(([props]) => props.option)
      .find((option) => Array.isArray(option?.series) && option?.series?.length === 2)

    expect(mainOption?.xAxis?.data).toEqual(['State A', 'State B'])
    expect(mainOption?.series?.[0]?.name).toBe('Quantity')
    expect(mainOption?.series?.[0]?.data).toEqual([70, 55])
    expect(mainOption?.series?.[1]?.name).toBe('Regularity')
    expect(mainOption?.series?.[1]?.data).toEqual([60, 80])
  })
})
