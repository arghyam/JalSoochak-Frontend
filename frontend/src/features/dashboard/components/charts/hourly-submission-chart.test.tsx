import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { renderWithProviders } from '@/test/render-with-providers'
import { HourlySubmissionChart } from './hourly-submission-chart'

type ChartOption = {
  xAxis: { data: string[] }
  series: Array<{ data: number[] }>
  tooltip: { formatter: (params: unknown) => string }
}

const mockEChartsWrapper = jest.fn((_props: { option: unknown }) => (
  <div data-testid="echarts-wrapper" />
))

jest.mock('@/shared/components/common/echarts-wrapper', () => ({
  EChartsWrapper: (props: { option: unknown }) => mockEChartsWrapper(props),
}))

const lastOption = () => {
  const call = mockEChartsWrapper.mock.calls.at(-1)
  return call?.[0].option as ChartOption
}

describe('HourlySubmissionChart', () => {
  beforeEach(() => {
    mockEChartsWrapper.mockClear()
  })

  it('plots one bar per hour of the day', () => {
    const counts = Array.from({ length: 24 }, (_, hour) => hour)
    renderWithProviders(<HourlySubmissionChart submissionsByHour={counts} />)

    const option = lastOption()
    expect(option.xAxis.data).toHaveLength(24)
    expect(option.xAxis.data[0]).toBe('00:00')
    expect(option.xAxis.data[23]).toBe('23:00')
    expect(option.series[0].data).toEqual(counts)
  })

  it('shows the hour slot, count and share of the day in the tooltip', () => {
    const counts = Array(24).fill(0)
    counts[9] = 30
    counts[10] = 10
    renderWithProviders(<HourlySubmissionChart submissionsByHour={counts} />)

    const tooltip = lastOption().tooltip.formatter([{ dataIndex: 9, value: 30 }])
    expect(tooltip).toContain('09:00 - 10:00')
    expect(tooltip).toContain('30')
    expect(tooltip).toContain('75%')
  })
})
