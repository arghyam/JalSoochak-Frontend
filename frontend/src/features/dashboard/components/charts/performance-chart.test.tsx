import { screen } from '@testing-library/react'
import { describe, expect, it, jest, beforeAll, afterAll } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { EntityPerformance } from '../../types'
import { AllStatesPerformanceChart } from './performance-chart'

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
  EChartsWrapper: () => <div data-testid="echarts-mock" />,
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
})
