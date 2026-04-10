import { render, screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import type { DemandSupplyData } from '../../types'
import { DemandSupplyChart } from './demand-supply-chart'

jest.mock('@/shared/components/common', () => ({
  EChartsWrapper: () => <div data-testid="echarts-mock" />,
}))

const data: DemandSupplyData[] = [
  { period: '2024', demand: 100, supply: 90 },
  { period: '2025', demand: 110, supply: 105 },
]

describe('DemandSupplyChart', () => {
  it('renders legend labels and chart area', () => {
    render(<DemandSupplyChart data={data} height={300} />)

    expect(screen.getByTestId('echarts-mock')).toBeTruthy()
    expect(screen.getByText('Demand')).toBeTruthy()
    expect(screen.getByText('Supply')).toBeTruthy()
  })
})
