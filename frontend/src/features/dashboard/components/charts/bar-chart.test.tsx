import { render, screen } from '@testing-library/react'
import { describe, expect, it, jest } from '@jest/globals'
import type { EntityPerformance } from '../../types'
import { BarChart } from './bar-chart'

const mockEChartsWrapper = jest.fn(
  ({ option }: { option: { title?: { text?: string } } & Record<string, unknown> }) => (
    <div data-testid="echarts-mock" data-title={option.title?.text} />
  )
)

jest.mock('@/shared/components/common', () => ({
  EChartsWrapper: (props: { option: { title?: { text?: string } } & Record<string, unknown> }) =>
    mockEChartsWrapper(props),
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
  {
    id: '3',
    name: 'Gamma',
    coverage: 30,
    regularity: 55,
    continuity: 20,
    quantity: 45,
    compositeScore: 40,
    status: 'needs-attention',
  },
  {
    id: '4',
    name: 'Delta',
    coverage: 15,
    regularity: 10,
    continuity: 10,
    quantity: 15,
    compositeScore: 10,
    status: 'good' as EntityPerformance['status'],
  },
]

describe('BarChart', () => {
  beforeEach(() => {
    mockEChartsWrapper.mockClear()
  })

  it('passes title and renders chart wrapper', () => {
    render(<BarChart data={sample} metric="regularity" title="Regularity by entity" height={200} />)

    const mock = screen.getByTestId('echarts-mock')
    expect(mock.getAttribute('data-title')).toBe('Regularity by entity')
  })

  it('accepts continuity metric without throwing', () => {
    render(<BarChart data={sample} metric="continuity" title="Continuity" />)

    expect(screen.getByTestId('echarts-mock')).toBeTruthy()
  })

  it('sorts values by selected metric and assigns expected colors', () => {
    const dataWithFallback = [
      ...sample,
      {
        id: '5',
        name: 'Fallback',
        coverage: 1,
        regularity: 35,
        continuity: 30,
        quantity: 10,
        compositeScore: 9,
        status: 'unknown' as EntityPerformance['status'],
      },
    ]

    render(<BarChart data={dataWithFallback} metric="regularity" title="Regularity by entity" />)

    const option = mockEChartsWrapper.mock.calls[0]?.[0]?.option as {
      xAxis: { data: string[] }
      yAxis: { name: string }
      series: Array<{ data: Array<{ value: number; itemStyle: { color: string } }> }>
      tooltip: { formatter: (params: unknown) => string }
    }

    expect(option.xAxis.data).toEqual(['Beta', 'Gamma', 'Fallback', 'Alpha', 'Delta'])
    expect(option.yAxis.name).toBe('Regularity %')
    expect(option.series[0]?.data.map((item) => item.value)).toEqual([80, 55, 35, 30, 10])
    expect(option.series[0]?.data.map((item) => item.itemStyle.color)).toEqual([
      '#ef4444',
      '#f97316',
      '#94a3b8',
      '#22c55e',
      '#22c55e',
    ])
  })

  it('renders continuity tooltip label and entity status text', () => {
    render(<BarChart data={sample} metric="continuity" title="Continuity by entity" />)
    const option = mockEChartsWrapper.mock.calls[0]?.[0]?.option as {
      tooltip: { formatter: (params: unknown) => string }
    }

    const html = option.tooltip.formatter([{ name: 'Beta', value: 60, dataIndex: 0 }])
    expect(html).toContain('Continuity: 60%')
    expect(html).toContain('Status: critical')
  })
})
