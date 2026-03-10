import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import type { WaterSupplyOutageData } from '../../types'
import { IssueTypeBreakdownChart } from './issue-type-breakdown-chart'

const mockEChartsWrapper = jest.fn((_props: { option: unknown }) => (
  <div data-testid="echarts-wrapper" />
))

jest.mock('@/shared/components/common/echarts-wrapper', () => ({
  EChartsWrapper: (props: { option: unknown }) => mockEChartsWrapper(props),
}))

beforeEach(() => {
  mockEChartsWrapper.mockClear()
})

const chartData: WaterSupplyOutageData[] = [
  {
    label: 'District A',
    electricityFailure: 10,
    pipelineLeak: 20,
    pumpFailure: 30,
    valveIssue: 40,
    sourceDrying: 50,
  },
]

describe('IssueTypeBreakdownChart', () => {
  it('shows tooltip on hover and keeps emphasis color same as base slice color', () => {
    renderWithProviders(<IssueTypeBreakdownChart data={chartData} />)

    const mainOption = (
      mockEChartsWrapper.mock.calls as Array<
        [
          {
            option?: {
              tooltip?: { show?: boolean; formatter?: (params: unknown) => string }
              series?: Array<{
                data?: Array<{
                  itemStyle?: { color?: string }
                  emphasis?: { itemStyle?: { color?: string } }
                }>
              }>
            }
          },
        ]
      >
    )
      .map(([props]) => props.option)
      .find((option) => Array.isArray(option?.series) && option.series.length > 0)

    const pieSeries = mainOption?.series?.[0]
    expect(mainOption?.tooltip?.show).toBe(true)

    const formatter = mainOption?.tooltip?.formatter
    expect(typeof formatter).toBe('function')
    const tooltipText = formatter?.({ name: 'Pump failure', value: 30 })
    expect(tooltipText).toContain('Pump failure')
    expect(tooltipText).toContain('30.0')
    expect(tooltipText).toContain('%')

    const pieData = pieSeries?.data ?? []
    pieData.forEach((slice) => {
      expect(slice.emphasis?.itemStyle?.color).toBe(slice.itemStyle?.color)
    })
  })
})
