import { render, screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import type { EntityPerformance } from '../../types'
import { BarChart } from './bar-chart'

jest.mock('@/shared/components/common', () => ({
  EChartsWrapper: ({ option }: { option: { title?: { text?: string } } }) => (
    <div data-testid="echarts-mock" data-title={option.title?.text} />
  ),
}))

const sample: EntityPerformance[] = [
  {
    id: '1',
    name: 'Alpha',
    coverage: 10,
    regularity: 30,
    continuity: 40,
    quantity: 50,
    compositeScore: 35,
    status: 'good',
  },
  {
    id: '2',
    name: 'Beta',
    coverage: 20,
    regularity: 80,
    continuity: 60,
    quantity: 55,
    compositeScore: 50,
    status: 'critical',
  },
]

describe('BarChart', () => {
  it('passes title and renders chart wrapper', () => {
    render(<BarChart data={sample} metric="regularity" title="Regularity by entity" height={200} />)

    const mock = screen.getByTestId('echarts-mock')
    expect(mock.getAttribute('data-title')).toBe('Regularity by entity')
  })

  it('accepts continuity metric without throwing', () => {
    render(<BarChart data={sample} metric="continuity" title="Continuity" />)

    expect(screen.getByTestId('echarts-mock')).toBeTruthy()
  })
})
